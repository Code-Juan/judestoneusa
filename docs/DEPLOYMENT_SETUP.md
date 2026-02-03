# Deployment Setup Guide - Judestone USA

## Branch Structure

- **main**: Production branch → GitHub Pages → `judestoneusa.com`
- **dev**: Development branch → Netlify → `dev.judestoneusa.com`

## Initial Setup Steps

### 1. Create GitHub Repository
```bash
# After creating repo on GitHub, add remote:
git remote add origin https://github.com/[your-username]/judestoneusa.git
```

### 2. Push Branches to GitHub
```bash
# Push main branch
git checkout main
git add .
git commit -m "Initial commit - Judestone USA website"
git push -u origin main

# Push dev branch
git checkout dev
git push -u origin dev
```

### 3. Configure GitHub Pages
1. Go to repository Settings → Pages
2. Source: Select "GitHub Actions"
3. The `.github/workflows/deploy.yml` will automatically deploy on push to `main`

### 4. Configure Netlify
1. Sign up/login at https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Branch to deploy**: `dev`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click "Deploy site"
6. Note your Netlify site name (e.g., `judestone-dev.netlify.app`)

### 5. Configure Custom Domain in Netlify
1. In Netlify dashboard → Site settings → Domain management
2. Add custom domain: `dev.judestoneusa.com`
3. Netlify will provide DNS instructions (use CNAME record)

### 6. Configure GoDaddy DNS
See `docs/DNS_CONFIGURATION_GUIDE.md` for detailed DNS setup instructions.

## Workflow

### Development Workflow
```bash
# Work on dev branch
git checkout dev
# Make changes
git add .
git commit -m "Description of changes"
git push origin dev
# Netlify automatically builds and deploys
```

### Production Deployment
```bash
# Merge dev to main
git checkout main
git merge dev
git push origin main
# GitHub Actions automatically builds and deploys to GitHub Pages
```

## Verification

After setup, verify:
- [ ] `judestoneusa.com` loads (GitHub Pages)
- [ ] `www.judestoneusa.com` loads (GitHub Pages)
- [ ] `dev.judestoneusa.com` loads (Netlify)
- [ ] GitHub Actions workflow runs successfully
- [ ] Netlify builds complete successfully
