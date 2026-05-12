import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mindforge.novelstudio',
  appName: '心御AI小说辅助器',
  webDir: '../desktop/dist/renderer',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e'
    }
  },
  android: {
    buildOptions: {
      minSdkVersion: 26,
      targetSdkVersion: 34
    }
  }
}

export default config
