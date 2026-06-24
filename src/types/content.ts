export interface Project {
  title: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  date: string;
}

export interface ContentData {
  projects: Project[];
}
