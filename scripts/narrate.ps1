$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$brRoot = Split-Path -Parent $PSScriptRoot
$brOutput = Join-Path $brRoot 'artifacts/walkthrough'
New-Item -ItemType Directory -Path $brOutput -Force | Out-Null
$brScenes = Get-Content -LiteralPath (Join-Path $brRoot 'docs/demo-scenes.json') -Raw -Encoding utf8 | ConvertFrom-Json
$brSpeech = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $brSpeech.SelectVoice('Microsoft Zira Desktop')
    $brSpeech.Rate = 1
    for ($brIndex = 0; $brIndex -lt $brScenes.Count; $brIndex++) {
        $brSpeech.SetOutputToWaveFile((Join-Path $brOutput ('voice-' + $brIndex + '.wav')))
        $brSpeech.Speak($brScenes[$brIndex].narration)
        $brSpeech.SetOutputToNull()
    }
} finally {
    $brSpeech.Dispose()
}
