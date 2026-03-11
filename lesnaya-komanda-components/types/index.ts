export interface NewsArticle {
  id: string | number;
  title: string;
  body: string;
  imageUrl: string;
  tags: Tag[];
}

export interface Tag {
  label: string;
  variant: 'default' | 'red' | 'purple' | 'violet';
}

export interface Streamer {
  id: string | number;
  name: string;
  description: string;
  imageUrl: string;
  twitchUrl?: string;
}

export interface NavItem {
  label: string;
  href: string;
}
