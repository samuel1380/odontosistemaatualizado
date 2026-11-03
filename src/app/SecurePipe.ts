import { Pipe, PipeTransform } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'secure'
})
export class SecurePipe implements PipeTransform {

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) { }

  async transform(src: string): Promise<string> {
    const currentUserString = localStorage.getItem("currentUser");
    const currentUser = currentUserString && JSON.parse(currentUserString);

    const headers = new HttpHeaders({'Authorization': `Bearer ${currentUser.token}`});
    const imageBlob = await this.http.get(src, {headers, responseType: 'blob'}).toPromise();

    if(!imageBlob) return "";

    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(imageBlob);
    });
  }
}
