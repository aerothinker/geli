import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {FileUploader} from 'ng2-file-upload';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-upload-form',
  templateUrl: './upload-form.component.html',
  styleUrls: ['./upload-form.component.scss']
})
export class UploadFormComponent implements OnInit, OnChanges {

  @Input()
  uploadPath: string;

  @Input()
  allowedMimeTypes: string[];

  @Input()
  additionalData: any;

  @Output()
  onFileSelectedChange = new EventEmitter();

  @Output()
  onFileUploaded = new EventEmitter();

  @Output()
  onAllUploaded = new EventEmitter();

  hasDropZoneOver = false;
  fileUploader: FileUploader;

  private first = true;
  private error = false;

  constructor(private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.fileUploader = new FileUploader({
      url: this.uploadPath,
      authToken: localStorage.getItem('token'),
      allowedMimeType: this.allowedMimeTypes
    });

    this.fileUploader.onBuildItemForm = (fileItem: any, form: any) => {
      form.append('data', JSON.stringify(this.additionalData))
    };

    this.fileUploader.onBeforeUploadItem = (fileItem) => {
      if (!this.first) {
        fileItem.method = 'PUT';

        if (fileItem.url !== this.uploadPath) {
          fileItem.url = this.uploadPath;
        }
      }
    };

    this.fileUploader.onCompleteAll = () => {
      if (!this.error) {
        this.snackBar.open('All items uploaded!', '', {duration: 3000});
      }
    };

    this.fileUploader.onCompleteItem = (file, response, status, headers) => {
      const responseObject = JSON.parse(response);
      if (status === 200) {
        this.error = false;
      }
      if (this.first && responseObject._id && status === 200) {
        this.first = false;
        // all subsequent (if any) uploads will be added to this unit
        this.onFileUploaded.emit(responseObject);
      }
    };

    this.fileUploader.onAfterAddingAll = (fileItems) => {
      this.onFileSelectedChange.emit(true);
    };

    this.fileUploader.onErrorItem = (item, response, status, headers) => {
      this.error = true;
      // reset the error state to try again later
      item.isError = false;
      item.isUploaded = false;
      this.snackBar.open(`${item._file.name} failed to upload`, 'Dismiss');
    };

    this.fileUploader.clearQueue();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('uploadPath') && !this.first) {
      this.fileUploader.uploadAll();
    }
  }

  clearQueue() {
   this.fileUploader.clearQueue();
   if (this.fileUploader.queue.length > 0) {
     this.snackBar.open('Queue couldn\'t be cleared.', 'Dismiss')
   } else {
     this.onFileSelectedChange.emit(false);
   }
  }

  uploadAll() {
    this.fileUploader.uploadItem(this.fileUploader.getNotUploadedItems()[0]);
  }

  onFileOverDropzone(event) {
  }
}
