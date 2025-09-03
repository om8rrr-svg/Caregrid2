# CORS and Vercel Proxy Testing Guide

## Environment Configuration

For Render deployment, set the following environment variable:
```
CORS_ORIGINS=https://caregrid2-ddk7.vercel.app,http://localhost:5173
```

## CORS Testing Commands

### Test Production Domain (should return 204/200)
```bash
curl -H "Origin: https://caregrid2-ddk7.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://<render-app>/api/clinics
```

### Test Vercel Preview Domain (should return 204/200)
```bash
curl -H "Origin: https://caregrid2-some-branch.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://<render-app>/api/clinics
```

### Test Unauthorized Domain (should fail with CORS error)
```bash
curl -H "Origin: https://evil.example" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://<render-app>/api/clinics
```

## Vercel Proxy Testing

1. Deploy to Vercel preview branch
2. Visit `https://<preview-url>/health-check.html`
3. Verify both endpoints show green "OK" badges
4. Run CLI smoke test: `npm run smoke https://<preview-url>`

## Expected Results

- **Authorized origins**: Return HTTP 204/200 with CORS headers
- **Unauthorized origins**: Return CORS error message
- **Vercel previews**: `/api/*` requests work without CORS issues
- **Health check page**: Shows green badges when backend is reachable
- **CLI smoke test**: Exits with code 0 on success, non-zero on failure

## Troubleshooting

- If CORS still blocks: Check CORS_ORIGINS environment variable on Render
- If proxy fails: Verify vercel.json rewrites and API base configuration  
- If health check fails: Check network connectivity to backend server