## Experiments in MiniLED (and some in OLED)

This repo is basically a dumping ground for things I want to do to fiddle with MiniLED and visualisers in general. I feel like there's a lack of fun screensaver type stuff these days and it makes no sense to me given how much better suited OLED screens are to this kind of stuff in terms of power consumption and just general ambiance.

While most people will only have either a very small OLED screen (phone, Switch, tablet), there's quite a lot of people with MiniLED screens on their macbooks. As that's what I have that will probably be my main focus.

## HTML Visualiser

Uses the browser AudioContext API to visualise a grid of audio based data on screen.

HTML based approach was taken for the following reasons:
- MiniLED technology is not operating in the same instantaneous way OLED does, meaning basically everything leaves loads of dimly lit artifacts briefly, by sticking to a grid I'm hoping this can both reduce the impact of these and potentially be refined to a process where there could be a very close to 1:1 relationship between cells and the MiniLEDs on a screen. As they use some level of diffusion this will never be perfect but it doesn't really matter once it's dim and somewhat consistent
- Restricts me from going crazy like I probably would do with a canvas output
- Basically every solution I saw for this used canvas and I've a feeling this might be a bit more accessible to a totally different audience than the people who made them.

### TODO

- clean up the code, loads and loads to do here
- UI for settings (cell size mainly)
- FFT adapting to changes in cell sizes
- Process for handling different visualisers
- Process for sanitizing the scale of changes


## Youtube filter tool

Basically a thing to put on a youtube video and have it playing at your desk while you fall asleep without it lighting up the whole room.

### TODO

- clean up like the other one, maybe standardise the controls UI across things
- 

