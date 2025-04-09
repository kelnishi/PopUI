import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './src/assets/app',
    appBundleId: 'com.kelnishi.popui',
    appCategoryType: 'public.app-category.productivity',
    appCopyright: 'Copyright © 2025 Kelvin Nishikawa',
    osxSign: {
      entitlements: './entitlements.plist',
      'entitlements-inherit': './entitlements.plist'
    } as any,
    extendInfo: {
      LSUIElement: true,
    }
  },
  rebuildConfig: {},
  makers: [
    // For Windows
    new MakerSquirrel({}, ['win32']), 
    // For macOS
    new MakerZIP({}, ['darwin', 'mas']),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/index.tsx',
            name: 'view',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
    // // Fuses are used to enable/disable various Electron functionality
    // // at package time, before code signing the application
    // new FusesPlugin({
    //   version: FuseVersion.V1,
    //   [FuseV1Options.RunAsNode]: false,
    //   [FuseV1Options.EnableCookieEncryption]: true,
    //   [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    //   [FuseV1Options.EnableNodeCliInspectArguments]: false,
    //   [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    //   [FuseV1Options.OnlyLoadAppFromAsar]: true,
    // }),
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "kelnishi",
          name: "PopUI"
        },
        prerelease: false,
        draft: false
      }
    }
  ],
};

export default config;