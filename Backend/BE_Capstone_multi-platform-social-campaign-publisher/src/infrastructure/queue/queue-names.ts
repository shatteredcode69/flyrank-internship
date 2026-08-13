export const PUBLISH_QUEUE_NAME = 'social-post-publish';

export interface PublishJobData {
  socialPostId: string;
}
