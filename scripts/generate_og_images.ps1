Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) "assets\img\logo-asnawiyyah.jpg"
$outSquare = Join-Path (Get-Location) "assets\img\og-image.jpg"
$outBanner = Join-Path (Get-Location) "assets\img\og-banner.jpg"

$src = [System.Drawing.Image]::FromFile($srcPath)

# 1. GENERATE SQUARE 600x600 OG IMAGE (Optimal for WhatsApp Link Preview)
$size = 600
$bmpSquare = New-Object System.Drawing.Bitmap($size, $size)
$gSquare = [System.Drawing.Graphics]::FromImage($bmpSquare)
$gSquare.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gSquare.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gSquare.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gSquare.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# Background: Clean White with subtle elegant emerald header/accent
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$gSquare.FillRectangle($whiteBrush, 0, 0, $size, $size)

# Emerald Gradient Top/Bottom Accent Borders
$emeraldColor = [System.Drawing.Color]::FromArgb(5, 150, 105) # #059669 brand-600
$emeraldDark = [System.Drawing.Color]::FromArgb(6, 78, 59)    # #064e3b
$emeraldBrush = New-Object System.Drawing.SolidBrush($emeraldColor)
$emeraldDarkBrush = New-Object System.Drawing.SolidBrush($emeraldDark)
$amberColor = [System.Drawing.Color]::FromArgb(245, 158, 11)   # #f59e0b amber-500
$amberBrush = New-Object System.Drawing.SolidBrush($amberColor)

# Top Bar (Emerald + Gold Accent)
$gSquare.FillRectangle($emeraldDarkBrush, 0, 0, $size, 16)
$gSquare.FillRectangle($amberBrush, 0, 16, $size, 6)

# Bottom Bar
$gSquare.FillRectangle($amberBrush, 0, ($size - 22), $size, 6)
$gSquare.FillRectangle($emeraldDarkBrush, 0, ($size - 16), $size, 16)

# Outer Border
$borderPen = New-Object System.Drawing.Pen($emeraldColor, 4)
$gSquare.DrawRectangle($borderPen, 2, 2, ($size - 4), ($size - 4))

# Draw Logo Centered (Scaled gracefully)
$logoTargetSize = 340
$logoX = ($size - $logoTargetSize) / 2
$logoY = 70
$gSquare.DrawImage($src, $logoX, $logoY, $logoTargetSize, $logoTargetSize)

# Add Typography using System Fonts
$fontFamilyTitle = New-Object System.Drawing.FontFamily("Arial")
$fontTitle = New-Object System.Drawing.Font($fontFamilyTitle, 24, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontSub = New-Object System.Drawing.Font($fontFamilyTitle, 16, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontMeta = New-Object System.Drawing.Font($fontFamilyTitle, 13, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$formatCenter = New-Object System.Drawing.StringFormat
$formatCenter.Alignment = [System.Drawing.StringAlignment]::Center

$titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42)) # slate-900
$subBrush = New-Object System.Drawing.SolidBrush($emeraldColor)
$metaBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139)) # slate-500

$rectTitle = New-Object System.Drawing.RectangleF(20, 428, ($size - 40), 32)
$rectSub = New-Object System.Drawing.RectangleF(20, 464, ($size - 40), 26)
$rectMeta = New-Object System.Drawing.RectangleF(20, 496, ($size - 40), 40)

$gSquare.DrawString("PPTQ ASNAWIYYAH", $fontTitle, $titleBrush, $rectTitle, $formatCenter)
$gSquare.DrawString("PONDOK PESANTREN TAHFIDZUL QUR'AN", $fontSub, $subBrush, $rectSub, $formatCenter)
$gSquare.DrawString("Pilangwetan, Kebonagung, Demak • asnawiyyah.or.id", $fontMeta, $metaBrush, $rectMeta, $formatCenter)

# Save with High Quality JPEG Encoder
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92L)

$bmpSquare.Save($outSquare, $jpegCodec, $encoderParams)
$gSquare.Dispose()
$bmpSquare.Dispose()


# 2. GENERATE 1200x630 LANDSCAPE BANNER (Facebook, Twitter, & Wide Rich Previews)
$bw = 1200
$bh = 630
$bmpBanner = New-Object System.Drawing.Bitmap($bw, $bh)
$gBanner = [System.Drawing.Graphics]::FromImage($bmpBanner)
$gBanner.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gBanner.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gBanner.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gBanner.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# Rich Dark Emerald Green Gradient-style background
$bgDarkGreen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(6, 44, 34)) # #062c22
$gBanner.FillRectangle($bgDarkGreen, 0, 0, $bw, $bh)

# Gold Accent Line Top & Bottom
$gBanner.FillRectangle($amberBrush, 0, 0, $bw, 10)
$gBanner.FillRectangle($amberBrush, 0, ($bh - 10), $bw, 10)

# Circular White Container for Logo on Left
$circleSize = 360
$circleX = 90
$circleY = ($bh - $circleSize) / 2
$gBanner.FillEllipse($whiteBrush, $circleX, $circleY, $circleSize, $circleSize)
$goldPen = New-Object System.Drawing.Pen($amberColor, 6)
$gBanner.DrawEllipse($goldPen, $circleX, $circleY, $circleSize, $circleSize)

# Logo inside circle
$logoInCircle = 300
$licX = $circleX + ($circleSize - $logoInCircle) / 2
$licY = $circleY + ($circleSize - $logoInCircle) / 2
$gBanner.DrawImage($src, $licX, $licY, $logoInCircle, $logoInCircle)

# Right Side Typography
$textLeft = 500
$fontBannerBadge = New-Object System.Drawing.Font($fontFamilyTitle, 16, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontBannerH1 = New-Object System.Drawing.Font($fontFamilyTitle, 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontBannerH2 = New-Object System.Drawing.Font($fontFamilyTitle, 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontBannerDesc = New-Object System.Drawing.Font($fontFamilyTitle, 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fontBannerUrl = New-Object System.Drawing.Font($fontFamilyTitle, 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$badgeBrush = New-Object System.Drawing.SolidBrush($amberColor)
$whiteSolid = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$mintBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(167, 243, 208)) # #a7f3d0
$dimWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(209, 213, 219)) # #d1d5db

$gBanner.DrawString("PORTAL RESMI PESANTREN & TAHFIDZ TERPADU", $fontBannerBadge, $badgeBrush, $textLeft, 140)
$gBanner.DrawString("PPTQ ASNAWIYYAH", $fontBannerH1, $whiteSolid, $textLeft, 175)
$gBanner.DrawString("Pondok Pesantren Tahfidzul Qur'an", $fontBannerH2, $mintBrush, $textLeft, 240)
$gBanner.DrawString("Pilangwetan, Kec. Kebonagung, Kab. Demak, Jawa Tengah", $fontBannerDesc, $dimWhite, $textLeft, 280)
$gBanner.DrawString("Layanan Santri • Mutaba'ah Tahfidz • Presensi • PPDB Online", $fontBannerDesc, $dimWhite, $textLeft, 320)

# URL pill badge
$pillX = $textLeft
$pillY = 390
$pillW = 320
$pillH = 48
$pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 118, 110)) # #0f766e
$gBanner.FillRectangle($pillBrush, $pillX, $pillY, $pillW, $pillH)
$pillPen = New-Object System.Drawing.Pen($amberColor, 2)
$gBanner.DrawRectangle($pillPen, $pillX, $pillY, $pillW, $pillH)
$gBanner.DrawString("🌐 https://asnawiyyah.or.id", $fontBannerUrl, $whiteSolid, ($pillX + 20), ($pillY + 13))

$bmpBanner.Save($outBanner, $jpegCodec, $encoderParams)
$gBanner.Dispose()
$bmpBanner.Dispose()

$src.Dispose()

Write-Host "SUCCESS: Generated og-image.jpg (600x600) and og-banner.jpg (1200x630)"
