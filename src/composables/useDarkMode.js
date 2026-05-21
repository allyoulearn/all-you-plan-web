import { ref, watch, onMounted } from 'vue'

const isDark = ref(true)

export function useDarkMode() {
  function toggle() {
    isDark.value = !isDark.value
    apply()
  }

  function apply() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      document.body.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.add('light')
    }
    localStorage.setItem('ayp_theme', isDark.value ? 'dark' : 'light')
  }

  onMounted(() => {
    const stored = localStorage.getItem('ayp_theme')
    isDark.value = stored ? stored === 'dark' : true
    apply()
  })

  return { isDark, toggle }
}
