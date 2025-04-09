import Store from 'electron-store';
import { app } from 'electron';
import yaml from 'js-yaml';

interface AppPreferences {
  toolCalls: number;
  autoSend: boolean;
}

const preferences = new Store<AppPreferences>({
  cwd: app.getPath('userData'),
  name: 'preferences',
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load as (data: string) => AppPreferences,
  
  defaults: {
    autoSend: true,
    toolCalls: 0
  }
});

export default preferences;