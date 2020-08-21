

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/grohjy/svelte-animation-driver">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Svelte-Animation-Driver</h3>

  <p align="center">
    Animation Driver gives you the power to control your animations
    <br />
    <a href="https://github.com/grohjy/svelte-animation-driver"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/grohjy/svelte-animation-driver">View Demo</a>
    ·
    <a href="https://github.com/grohjy/svelte-animation-driver/issues">Report Bug</a>
    ·
    <a href="https://github.com/grohjy/svelte-animation-driver/issues">Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
## Table of Contents

- [Table of Contents](#table-of-contents)
- [About The Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)



<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://example.com)

I needed to run multiple animations together and control the running. I couldn't find the easy way to do it with Svelte, so I created this helper package: Animation Driver.  
This package doesn't animate anything by itself, but it'll give you a way to manipulate t-value, which can be used to run animations.

Animation Driver gives you these:
* Run multiple animations together 
* Control animations playhead ie. stop animation, jump to different position, reverse
* Loop animation, run it back and fort
* Control speed and running direction
* Manipulate sub-animations with helper functions
  * run only certain slice of animation
  * run animation in step-mode
  * repeat animation multiple time during original duration
  * run sub-animation back-and-fort
* A couple of handy functions
  * mapRange = fit t-value 0->1 to any range you need
  * u = reverse t-value


More info in Getting Started and Examples sections.

### Built With
* [Svelte](https://svelte.dev/)



<!-- GETTING STARTED -->
## Getting Started

This addon works with Svelte, so you should be familiar with svelte.

### Prerequisites

Install first vscode-editor and npm or yarn package manager. You can also install Svelte starter template
* yarn
```sh
npm install -g yarn
```

* Svelte starter template
```sh
npx degit sveltejs/template my-svelte-project
cd my-svelte-project
yarn
yarn dev
```

### Installation

Install Animation Driver
```sh
yarn add svelte-animation-driver
```
Import Animation Driver to your component-file (for ex. App.svelte)
```sh
import { animationDriver } from 'svelte-animation-driver'
```


<!-- USAGE EXAMPLES -->
## Usage

Minimal setup is following:
App.svelte
```sh
<script>
import { animationDriver } from 'svelte-animation-driver'
const drv = animationDriver()
let x
new drv.addAnimation(0, 3000, (t) => x=t)
drv.play()
</script>
    
<div 
  style="background-color:pink;
    width:{x*100 + 250}px;"
>
    t-value:{x}
</div>
```

Let's breakdown each line:  
Initialize `drv` with imported `animationDriver`  
Create reactive variable `x`  
Add new sub-animation to `drv` with delay = 0 and duration = 3s, the last argument is a callback function that will run everytime t-value is changed. Set `x = t` in callback in order to keep `x` updated.  
Start animations by `drv.play()`  

Make `div` with pink background and with width initially 250px. 
Add text to div.  

When animation runs it updates `x` and the width increases gradually to 350px and text says `t-value: ` with number running from 0 to 1.

_You can find example projects from [Animation Driver's Github page](https://github.com/grohjy/svelte-animation-driver)_


<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/grohjy/svelte-animation-driver/issues) for a list of proposed features (and known issues).



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact

Your Name - [@jyrki_grohn](https://twitter.com/jyrki_grohn) - jyrki@jyrkigrohn.com

Project Link: [https://github.com/grohjy/svelte-animation-driver](https://github.com/grohjy/svelte-animation-driver)



<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements
* [Svelte](https://svelte.dev/)





<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[product-screenshot]: images/screenshot.png
