export interface State {
  name: string;
  code: string;
}

export interface Country {
  name: string;
  code: string;
  states: State[];
  phonePrefix: string;
} 