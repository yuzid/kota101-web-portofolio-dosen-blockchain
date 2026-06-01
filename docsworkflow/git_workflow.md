# Git Development Flow Documentation

# Overview

Dokumen ini menjelaskan alur development repository menggunakan Git dan GitHub dengan struktur branch:

* `main`
* `build`
* `fitur/*`

Flow ini digunakan untuk:

* menjaga kestabilan production
* mempermudah collaboration
* meminimalkan conflict
* memastikan proses testing berjalan sebelum release production

---

# Struktur Branch

## 1. Main Branch

Branch production/stable.

Karakteristik:

* hanya berisi code yang sudah stabil
* digunakan untuk deployment production
* tidak boleh langsung commit
* semua perubahan wajib melalui Pull Request

Contoh:

```text id="trcm8j"
main
```

---

## 2. Build Branch

Branch staging/development integration.

Fungsi:

* tempat penggabungan seluruh feature branch
* digunakan untuk testing/UAT/staging
* menjadi sumber pembuatan branch fitur baru

Contoh:

```text id="d17q6j"
build
```

---

## 3. Feature Branch

Branch untuk development fitur tertentu.

Format penamaan:

```text id="7r8cb9"
fitur/login
fitur/payment
fitur/dashboard
```

Atau:

```text id="umh2bi"
feature/login
feature/payment
```

Karakteristik:

* dibuat dari `build`
* digunakan hanya untuk 1 task/fitur
* setelah merge biasanya dihapus

---

# Visualisasi Flow

```text id="89yl0s"
main (production)
   ↑
build (staging/develop)
   ↑
fitur/login
fitur/payment
fitur/dashboard
```

---

# Development Workflow

# 1. Update Branch Build

Sebelum membuat branch fitur baru, pastikan branch `build` sudah terbaru.

```bash id="d3nlcl"
git checkout build
git pull origin build
```

Penjelasan:

* pindah ke branch `build`
* mengambil update terbaru dari remote repository

---

# 2. Membuat Branch Feature Baru

Buat branch fitur dari `build`.

## Menggunakan checkout

```bash id="1dysvu"
git checkout -b fitur/login
```

## Menggunakan switch

```bash id="v0t3ef"
git switch -c fitur/login
```

---

# 3. Push Branch Feature ke Remote

```bash id="wnr6ya"
git push -u origin fitur/login
```

Penjelasan:

* upload branch ke GitHub
* `-u` digunakan agar push berikutnya cukup menggunakan `git push`

---

# 4. Development Feature

Lakukan development pada branch feature.

Contoh workflow:

```bash id="ohvy0q"
git add .
git commit -m "feat: add login feature"
```

Push perubahan:

```bash id="6wjlwm"
git push
```

---

# 5. Sync Branch Feature dengan Build

## Kenapa Perlu Sync?

Karena:

* developer lain dapat merge feature baru ke `build`
* branch fitur bisa tertinggal
* conflict dapat muncul saat Pull Request

Oleh karena itu branch feature perlu update dari `build`.

---

# Cara Sync Feature dengan Build

# Opsi 1 — Merge Build ke Feature (Recommended untuk Team Kecil)

## Update build terlebih dahulu

```bash id="vflkg0"
git checkout build
git pull origin build
```

## Kembali ke branch feature

```bash id="rmsj0e"
git checkout fitur/login
```

## Merge build ke feature

```bash id="94v0sv"
git merge build
```

Jika terjadi conflict:

* resolve conflict
* commit hasil merge

Push hasil merge:

```bash id="zhofdk"
git push
```

---

# Opsi 2 — Rebase Build ke Feature (History Lebih Bersih)

## Fetch update terbaru

```bash id="uhwxvx"
git fetch origin
```

## Rebase feature ke build

```bash id="0onx1u"
git rebase origin/build
```

Jika terjadi conflict:

* resolve conflict
* lanjutkan rebase

```bash id="x6jgg9"
git rebase --continue
```

Jika ingin membatalkan:

```bash id="q3g8u6"
git rebase --abort
```

Setelah selesai:

```bash id="2j8pqk"
git push --force-with-lease
```

---

# Kapan Harus Sync dari Build?

Disarankan melakukan sync:

## 1. Sebelum mulai development

```bash id="sx9mcm"
git checkout build
git pull origin build
git checkout fitur/login
git merge build
```

---

## 2. Sebelum membuat Pull Request

Agar branch feature:

* tidak tertinggal
* minim conflict
* testing lebih valid

---

## 3. Saat branch feature sudah lama dibuat

Semakin lama branch dibuat tanpa sync:

* semakin besar kemungkinan conflict

---

# 6. Membuat Pull Request Feature ke Build

Setelah feature selesai:

Push perubahan:

```bash id="8dktqe"
git push
```

Buat Pull Request di GitHub:

```text id="sy2vly"
base: build
compare: fitur/login
```

Tahapan:

* code review
* testing
* approval
* merge ke `build`

---

# 7. Update Local Build Setelah Merge

```bash id="mrzjlwm"
git checkout build
git pull origin build
```

---

# 8. Release Build ke Main

Jika branch `build` sudah stabil dan lolos testing:

Buat Pull Request:

```text id="tl6pwa"
base: main
compare: build
```

Kemudian merge ke `main`.

---

# 9. Deploy Production

Deployment production dilakukan dari:

```text id="jlwm7s"
main
```

---

# Workflow Lengkap Singkat

## Membuat Feature

```bash id="fwjlwm"
git checkout build
git pull origin build
git checkout -b fitur/login
git push -u origin fitur/login
```

---

## Development

```bash id="k5cy7i"
git add .
git commit -m "feat: add login"
git push
```

---

## Sync dengan Build

```bash id="66rmxg"
git checkout build
git pull origin build

git checkout fitur/login
git merge build
```

---

## Pull Request

```text id="4y10hz"
fitur/login -> build
```

---

## Release Production

```text id="jlwmn0"
build -> main
```

---

# Git Commands Reference

# Pindah Branch

```bash id="e64rll"
git checkout nama_branch
```

atau:

```bash id="83gsp7"
git switch nama_branch
```

---

# Membuat Branch Baru

```bash id="a08zjy"
git checkout -b nama_branch
```

atau:

```bash id="x7b1lm"
git switch -c nama_branch
```

---

# Pull Update

```bash id="xb1b1v"
git pull origin build
```

---

# Push Branch

```bash id="jlwm4n"
git push -u origin nama_branch
```

---

# Commit Perubahan

```bash id="lpsjlwm"
git add .
git commit -m "message"
```

---

# Melihat Branch

Local branch:

```bash id="jlwm6k"
git branch
```

Remote branch:

```bash id="xjlwm0"
git branch -r
```

---

# Menghapus Branch Local

```bash id="jlwm8a"
git branch -d fitur/login
```

---

# Menghapus Branch Remote

```bash id="jlwm3m"
git push origin --delete fitur/login
```

---

# Best Practice

# 1. Jangan Commit Langsung ke Main

Gunakan Pull Request untuk semua perubahan.

---

# 2. Gunakan Protected Branch

Disarankan:

* protect `main`
* protect `build`

Aktifkan:

* Require Pull Request
* Require Review
* Require Status Check

---

# 3. Satu Branch untuk Satu Fitur

Hindari:

* banyak fitur dalam satu branch
* branch terlalu lama tidak di-merge

---

# 4. Lakukan Sync Berkala dari Build

Tujuan:

* mengurangi conflict
* menjaga branch tetap update

---

# 5. Gunakan Commit Message yang Konsisten

Contoh:

```text id="jlwm5q"
feat: add login page
fix: resolve auth bug
refactor: improve dashboard service
docs: update README
```

---

# Rekomendasi Flow untuk Team

## Team Kecil / Beginner

Gunakan:

* merge build -> feature

Karena:

* lebih mudah
* lebih aman
* tidak mengubah history

---

## Team Menengah / Advanced

Gunakan:

* rebase

Karena:

* history lebih bersih
* commit tree lebih rapi

---

# Summary

Flow development yang digunakan:

```text id="jlwm1f"
fitur/* -> build -> main
```

Dengan aturan:

* feature dibuat dari build
* feature wajib sync dengan build secara berkala
* semua merge menggunakan Pull Request
* production hanya dari main
