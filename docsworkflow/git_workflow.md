# Git Development Flow Documentation

## Branch Structure

Repository menggunakan 3 jenis branch utama:

* `main` → branch production/stable
* `build` → branch staging/development integration
* `fitur/*` → branch feature untuk development per task

---

# Development Flow

```text
main
  ↑
build
  ↑
fitur/*
```

Flow development:

1. Membuat branch fitur dari `build`
2. Melakukan development pada branch fitur
3. Membuat Pull Request dari `fitur/*` ke `build`
4. Melakukan testing dan review pada `build`
5. Membuat Pull Request dari `build` ke `main`
6. Deploy production dari `main`

---

# Workflow Lengkap

## 1. Update Branch Build

Sebelum membuat branch fitur baru, pastikan branch `build` sudah terbaru.

```bash
git checkout build
git pull origin build
```

---

## 2. Membuat Branch Fitur

Buat branch fitur dari `build`.

```bash
git checkout -b fitur/login
```

Atau menggunakan command modern:

```bash
git switch -c fitur/login
```

Push branch ke remote repository:

```bash
git push -u origin fitur/login
```

---

## 3. Development Feature

Lakukan development pada branch fitur.

Setelah selesai coding:

```bash
git add .
git commit -m "feat: add login feature"
```

Push perubahan:

```bash
git push
```

---

## 4. Pull Request Feature ke Build

Buat Pull Request di GitHub:

```text
base: build
compare: fitur/login
```

Tahapan:

* Code review
* Testing
* Merge ke branch `build`

Setelah merge, branch fitur dapat dihapus.

---

## 5. Update Branch Build Setelah Merge

```bash
git checkout build
git pull origin build
```

---

## 6. Release Build ke Main

Jika branch `build` sudah stabil dan siap production, buat Pull Request:

```text
base: main
compare: build
```

Kemudian merge ke `main`.

---

## 7. Deploy Production

Deployment production dilakukan dari branch:

```text
main
```

---

# Command Git yang Sering Digunakan

## Pindah Branch

```bash
git checkout nama_branch
```

Atau:

```bash
git switch nama_branch
```

---

## Membuat Branch Baru

```bash
git checkout -b nama_branch
```

Atau:

```bash
git switch -c nama_branch
```

---

## Pull Update Terbaru

```bash
git pull origin build
```

---

## Push Branch

```bash
git push -u origin nama_branch
```

---

## Commit Perubahan

```bash
git add .
git commit -m "message"
```

---

## Melihat Daftar Branch

Local branch:

```bash
git branch
```

Remote branch:

```bash
git branch -r
```

---

# Flow Development yang Direkomendasikan

## Saat Memulai Task Baru

```bash
git checkout build
git pull origin build
git checkout -b fitur/nama-fitur
```

---

## Saat Menyelesaikan Task

```bash
git add .
git commit -m "feat: ..."
git push -u origin fitur/nama-fitur
```

Buat Pull Request:

```text
fitur/nama-fitur -> build
```

---

## Saat Release Production

Buat Pull Request:

```text
build -> main
```

---

# Best Practice

## 1. Jangan Commit Langsung ke Main atau Build

Disarankan:

* `main` protected branch
* `build` protected branch

Semua perubahan wajib melalui Pull Request.

---

## 2. Naming Convention Branch

Contoh naming branch yang baik:

```text
feature/login
feature/payment
fix/navbar
hotfix/token
```

Atau:

```text
feat/login
bugfix/auth
```

---

## 3. Fungsi Tiap Branch

| Branch  | Fungsi                |
| ------- | --------------------- |
| main    | Production            |
| build   | Staging / Integration |
| fitur/* | Development per fitur |

---

# Visualisasi Branch Flow

```text
main (production)
   ↑
build (staging/develop)
   ↑
fitur/login
fitur/payment
fitur/dashboard
```

Setelah seluruh fitur stabil di `build`, perubahan dapat dinaikkan ke `main`.
