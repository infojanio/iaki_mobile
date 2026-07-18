const sharp = require('sharp')
const path = require('path')

async function makeSquareIcon(input, output, background = '#ffffff') {
  const buffer = await sharp(input)
    .resize(1024, 1024, {
      fit: 'contain',
      background,
    })
    .png()
    .toBuffer()

  await sharp(buffer).toFile(output)

  console.log(`✅ Gerado: ${output}`)
}

async function main() {
  const assetsPath = path.resolve(__dirname, '../src/assets')

  await makeSquareIcon(
    path.join(assetsPath, 'icon.png'),
    path.join(assetsPath, 'icon-fixed.png'),
    '#ffffff',
  )

  await makeSquareIcon(
    path.join(assetsPath, 'adaptive-icon.png'),
    path.join(assetsPath, 'adaptive-icon-fixed.png'),
    { r: 255, g: 255, b: 255, alpha: 0 },
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
