// Redirection vers la route dans (tabs) pour avoir le layout avec les tabs
import { Redirect } from 'expo-router';

export default function SensorsRedirect() {
  return <Redirect href="/(tabs)/sensors" />;
}
