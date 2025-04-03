import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          welcome: 'Welcome to AI Image Generation',
          generate: 'Generate Image',
          prompt: 'Enter your prompt',
          style: 'Select style',
          size: 'Select size',
          upload: 'Reference Image',
          generating: 'Generating...',
          cancel: 'Cancel',
          download: 'Download',
          error: 'Error occurred',
          login: 'Login',
          register: 'Register',
          logout: 'Logout',
          username: 'Username',
          password: 'Password',
          confirmPassword: 'Confirm Password',
          imageDescription: 'Enter your image description, select style and size, and optionally upload a reference image.',
          promptPlaceholder: 'Example: A cute kitten playing in the sunlight with a beautiful garden background',
          supportedFormats: 'Supports JPG and PNG formats',
          realistic: 'Realistic',
          anime: 'Anime',
          artistic: 'Artistic',
          allFieldsRequired: 'Please fill in all required fields',
          passwordsDoNotMatch: 'Passwords do not match',
          registrationFailed: 'Registration failed',
          registering: 'Registering...',
          invitationCode: 'Invitation Code',
          email: 'Email',
          noAccountRegister: 'Register Now',
          inviteCode: 'Invite Code',
          unleashCreativity: 'Unleash Unlimited Creativity',
          freeGenerator: 'Free, Fast, Unlimited AI Image Generator',
          bestImageQuality: 'Best Image Quality',
          simpleDesign: 'Simple Operation Design',
          unlimitedCreation: 'Unlimited Creation',
          professionalTech: 'Professional Generation Technology',
          customPrompt: 'Custom Prompt',
          general: 'General',
          clear: 'Clear',
          startGenerate: 'Start Generate',
        }
      },
      zh: {
        translation: {
          welcome: '一键创造精美AI图像😁',
          generate: '生成图片',
          prompt: '输入提示词',
          style: '选择风格',
          size: '选择尺寸',
          upload: '参考图',
          generating: '生成中...',
          cancel: '取消',
          download: '下载',
          error: '发生错误',
          login: '登录',
          register: '注册',
          logout: '退出登录',
          username: '用户名',
          password: '密码',
          confirmPassword: '确认密码',
          imageDescription: '请输入您想要生成的图片描述，选择合适的风格和尺寸，也可以上传参考图片。',
          promptPlaceholder: '例如：一只可爱的小猫咪在阳光下玩耍，背景是美丽的花园',
          supportedFormats: '支持 JPG、PNG 格式',
          realistic: '写实',
          anime: '动漫',
          artistic: '艺术',
          allFieldsRequired: '请填写所有必填字段',
          passwordsDoNotMatch: '两次输入的密码不一致',
          registrationFailed: '注册失败',
          registering: '注册中...',
          invitationCode: '请输入邀请码',
          email: '邮箱',
          noAccountRegister: '去注册',
          inviteCode: '邀请码',
          unleashCreativity: '释放你的无限创意🚀',
          freeGenerator: '免费、快速、无限制的AI图像生成器',
          bestImageQuality: '最好的图像质量',
          simpleDesign: '简单的操作设计',
          unlimitedCreation: '无限制创作',
          professionalTech: '专业的生成技术',
          customPrompt: '客制提示',
          general: '通用',
          clear: '清除',
          startGenerate: '开始生成',
        }
      }
    },
    lng: 'zh',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;