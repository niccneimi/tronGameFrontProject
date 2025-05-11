### Инструкция по локальному запуску

Скачайте и установите Deno если нет
```bash
curl -fsSL https://deno.land/install.sh | sh
```
Также добавте в PATH при необходимости
```bash
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
```

Выполните команду из рабочей директории с проектом
```bash
deno run --allow-net --allow-read --unstable --unstable-kv main.ts
```

### Инструкция по деплою на Deno Deploy

Создайте репозиторий на GitHub и запуште в него директорию с проектом. Далее создайте в [Deno](https://dash.deno.com/) проект и свяжите с репоизиторием с проектом.