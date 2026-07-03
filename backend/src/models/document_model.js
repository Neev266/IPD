export class Document {
  constructor(id, title, subtitle, rawHtml, cloudinaryUrl, cloudinaryPublicId) {
    this.id = id;
    this.title = title;
    this.subtitle = subtitle;
    this.rawHtml = rawHtml;
    this.cloudinaryUrl = cloudinaryUrl;
    this.cloudinaryPublicId = cloudinaryPublicId;
    this.createdAt = new Date();
  }
}
