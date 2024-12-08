import { useSettingsStore } from './stores/settings-store';

export const config = {
  openai: {
    get apiKey() {
      return useSettingsStore.getState().openAIKey;
    }
  }
};

export function validateConfig() {
  if (!config.openai.apiKey) {
    throw new Error('Please add your OpenAI API key in settings before proceeding.');
  }
  return true;
}