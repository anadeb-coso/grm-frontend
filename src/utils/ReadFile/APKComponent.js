import * as IntentLauncher from 'expo-intent-launcher';

export const openAPK = async (localUri) => {
  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ACTION_INSTALL_PACKAGE,
      {
        data: localUri,
        type: 'application/vnd.android.package-archive',
      }
    );
  } catch (error) {
    console.error('Error opening APK:', error);
  }
};