$dirs = @(
    "src\components\team",
    "src\components\investment",
    "src\components\wallet",
    "src\context",
    "src\hooks",
    "src\layouts",
    "src\layouts\components",
    "src\pages",
    "src\pages\auth",
    "src\pages\dashboard",
    "src\pages\team",
    "src\pages\investment",
    "src\pages\wallet",
    "src\services",
    "src\utils"
)

foreach ($dir in $dirs) {
    New-Item -Path $dir -ItemType Directory -Force
}
