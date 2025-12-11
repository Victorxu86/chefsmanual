import {getRequestConfig} from 'next-intl/server';
import zh from '../../messages/zh.json';
import en from '../../messages/en.json';

const messages = {
  zh,
  en
} as const;
 
export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
 
  // Ensure that a valid locale is used
  if (!locale || !['en', 'zh'].includes(locale as any)) {
    locale = 'zh';
  }
 
  return {
    locale,
    messages: messages[locale as keyof typeof messages]
  };
});
