# door

## Install

```
pip2 install git+https://github.com/MilicaSelakovic/door
```

## Uninstall

```
pip2 uninstall door
```

## Run

```
python2 -m door
```

## Usage

FFT Spectrogram connected to the microphone is displayed all the time. 
Score given by the last performed test is also displayed below.

### Mode 1
Play pink noise and display it's FFT spectrogram of the sound that is playing 
in addition to the one connected to the microphone.
 
 ### Mode 2
 Perform a test. Single test consists of 3 phases.
 
 1. Measure noise level.
 2. Play an impulse of given frequency.
 3. Measure impulse response.
 
 After performing each test the displayed score is updated. Score ranges from 0 to 100.