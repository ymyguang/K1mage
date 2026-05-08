# User Management MVP

This MVP adds WeChat login, JWT auth, user points, generation records, and simple admin APIs.

## Local Setup

1. Start MySQL.

If Docker is available:

```bash
docker compose -f docker-compose.mysql.yml up -d
```

Then use:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=k1mage
MYSQL_PASSWORD=k1mage_password
MYSQL_DATABASE=k1mage
```

If you use a local MySQL install, create or configure a database named `k1mage`.

On this Windows dev machine, MySQL data is stored outside the C drive:

```text
E:\k1mage-mysql\data
```

If MySQL is not running after a reboot, start it with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-local-mysql.ps1
```

2. Configure auth.

For real WeChat login:

```env
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret
DEV_WECHAT_LOGIN=false
```

For local frontend debugging without a WeChat secret:

```env
DEV_WECHAT_LOGIN=true
DEV_WECHAT_OPENID=dev_openid
```

`DEV_WECHAT_LOGIN` only works when `NODE_ENV` is not `production`.

3. Initialize tables.

```bash
npm run db:init
```

4. Start the API server.

```bash
npm run dev
```

## Points

The current default cost is controlled by:

```env
DEFAULT_IMAGE_COST_POINTS=1
```

The template API returns `point_cost`, so the mini program can display the actual point cost.

Later, a template can opt into its own point price by adding `points_per_image` to `price.json`.

## Mock Image Generation

For testing the mini program without spending model API credits:

```env
ENABLE_IMAGE_MOCK=true
PUBLIC_API_BASE_URL=http://192.168.5.147:3001
```

When enabled, the API still checks login, deducts points, and writes generation records. Only the expensive model call is replaced with a mock image result.

## Hide Templates Temporarily

To keep template files and code while hiding them from the mini program catalog:

```env
HIDDEN_TEMPLATE_IDS=customPrompt,polaroid
```
