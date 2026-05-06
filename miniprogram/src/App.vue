<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style>
page {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

:root {
  --bg-primary: #000000;
  --bg-secondary: #1a1a1a;
  --bg-card: #111111;
  --bg-card-alpha: rgba(17, 17, 17, 0.6);
  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  --border-primary: rgba(255, 255, 255, 0.1);
  --accent-primary: #f97316;
  --accent-secondary: #facc15;
  --accent-primary-hover: #ea580c;
  --accent-secondary-hover: #eab308;
  --accent-shadow: rgba(249, 115, 22, 0.2);
  --text-on-accent: #000000;
  --bg-disabled: #374151;
  --text-disabled: #6b7280;
}
</style>
