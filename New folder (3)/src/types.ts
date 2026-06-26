export interface Template {
  id: string;
  name: string;
  description: string;
  html: string;
  icon: string;
}

export interface SelectedConfig {
  tagName: string;
  textContent: string;
  href?: string;
  src?: string;
  alt?: string;
  placeholder?: string;
  clickLink?: string;
  
  // Style properties mapped from active styles
  fontSize: string;
  fontWeight: string;
  color: string;
  backgroundColor: string;
  textAlign: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  borderRadius: string;
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
  width: string;
  height: string;
  opacity: string;
  display: string;
  position?: string;
  zIndex?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  flexDirection?: string;
  alignItems?: string;
  justifyContent?: string;
  animationType?: string;
  animationTrigger?: string;
  animationDuration?: string;
  animationDelay?: string;
  animationTiming?: string;
  scrollEffect?: string;
  scrollRegion?: string;
  scrollSpeed?: string;
}

export interface ElementShortcut {
  name: string;
  tag: string;
  label: string;
  category: 'text' | 'container' | 'advanced' | 'media';
  defaultClass: string;
  defaultContent: string;
}

export interface WebsiteFile {
  name: string;
  path: string;
  content: string;
  type: 'html' | 'css' | 'js' | 'other';
}

