<h1 align="center"> ⚔️Code Formation 🛡 </h1> 
<!-- ⚙️🏗️🛡🐉🔮🐲 -->
<p align="center">
  <a href="https://github.com/NLKNguyen/code-formation/blob/master/LICENSE" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/github/license/NLKNguyen/code-formation.svg?color=blueviolet" />
  </a>

  <a href="https://github.com/NLKNguyen/code-formation/issues" target="_blank">
    <img alt="Closed issues" src="https://img.shields.io/github/issues-closed-raw/NLKNguyen/code-formation.svg?color=yellow" />
  </a>

  <a href="https://www.patreon.com/Nikyle" title="Donate to this project using Patreon">
    <img src="https://img.shields.io/badge/support%20me-patreon-red.svg" alt="Patreon donate button" />
  </a>

  <a href="https://paypal.me/NLKNguyen" title="Donate one time via PayPal">
    <img src="https://img.shields.io/badge/paypal-me-blue.svg" alt="PayPal donate button" />
  </a>
</p>

<p align="center">
  <a href="https://www.buymeacoffee.com/Nikyle" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height=45 />
  </a>
</p>
 

# 💡 Overview and thoughts

This is an experimental stage of a context-free meta programming / code generation tool that automates a set of common programming/writing tasks by using a template-based DSL embedded directly in your scripts (typically as source comments or out-of-source text files). 

The motivation behind this is to solve 5 categories of problems that I found myself often getting into in software engineering, and it stretches beyond the use cases of code writing. Only 1 category is in focus of the current development.

This introduces a language called CFL (Code-Formation Language) that is used for configuring the text generation process right in your code base as a mean for meta programming, and it sits on top of [EJS](https://ejs.co/) template engine which means you can program dynamic code generation for high reusability. This language should be embeddable safely in your code as comments without affecting anything, and there are options to further prevent it from being confused with your own code syntax while parsing.

If you have used a template engine to render code for whatever reason, this tool will speak to you. At a minimum, this can be a code scalfolding tool. At a larger extend, it is intended to be generalized enough to suit your typical code generation needs so that you don't need to write yet another one-off tool.

Eventually, it will be able to interpolate with external tools easily as one of the main goals because there are many great string processing CLI tools out there (sed, awk, jq, miller, random formatters, etc.), and that will be the easiest way to extend this tool's capabilities.

Once CFL has enough features, likely turing complete, higher levels of meta programming will be possible, and there are foreseable use cases for that, but we will assess whether it's worth exploited due to the trade-off of mental gymnastic required to do meta-meta-programming.

You can start using this tool today, just be aware that it can be unstable at the early stage.
# 🛠️ Installation

Required Node.js in your system in order to execute these commands in a terminal.

### Option 1: Install recent publication globally from NPM

```sh 
npm install -g code-formation
```

```sh 
code-formation --help
```

### Option 2: Use directly the latest code from GitHub

```sh
git clone https://github.com/NLKNguyen/code-formation

```

then go into the cloned directory to install depedencies

```sh
cd code-formation
npm install
```

and use it.

```sh
node index.js --help
```

If you want to install this globally, you can do so as well from the same directory:

```sh
npm install -g
```

Now you can use it anywhere in your terminal:

```sh 
code-formation --help
```

# 📝 Command Line Interface Usage

```
code-formation --scan [file glob patterns] --outdir [base path for output files]
```

# ⭐ Understand through examples

It's probably best to explain at this early stage by walking through examples that are included in [this repository](https://github.com/NLKNguyen/code-formation). Below are examples on how this tool can help in 5 categories. 

### Category 1: unify output from decentralized source files

Code Formation lets you define chunks of text in many files and unifies them in the destinations you choose with the order you specify.

**Example 1:** make SQL migration scripts from standalone DDL files

```
code-formation --scan ./examples/01_sql_migration_from_scripts/input/** --outdir ./examples/01_sql_migration_from_scripts/output/
```


### Category 2: TODO

### Category 3: TODO

### Category 4: TODO

### Category 5: TODO



# 👋 Author

<!-- ### 🏠🏗️ [Homepage](https://github.com/NLKNguyen/papercolor-theme) -->

👤 **Nikyle Nguyen**

  <a href="https://twitter.com/NLKNguyen" target="_blank">
    <img alt="Twitter: NLKNguyen" src="https://img.shields.io/twitter/follow/NLKNguyen.svg?style=social" />
  </a>

-   Twitter: [@NLKNguyen](https://twitter.com/NLKNguyen)
-   Github: [@NLKNguyen](https://github.com/NLKNguyen)
-   LinkedIn: [@NLKNguyen](https://linkedin.com/in/NLKNguyen)

# 🤝 Contributing

Give a ⭐️ if this project can help you in day-to-day engineering work!

Contributions, issues and feature requests are welcome! Feel free to check [issues page](https://github.com/NLKNguyen/code-formation/issues).

## 🙇 Your support is very much appreciated

I create open-source projects on GitHub and continue to develop/maintain as they are helping others. You can integrate and use these projects in your applications for free! You are free to modify and redistribute anyway you like, even in commercial products.

I try to respond to users' feedback and feature requests as much as possible. Obviously, this takes a lot of time and efforts (speaking of mental context-switching between different projects and daily work). Therefore, if these projects help you in your work, and you want to encourage me to continue create, here are a few ways you can support me:

-   💬 Following my blog and social profiles listed above to help me connect with your network
-   ⭐️ Starring this project and sharing with others as more users come, more great ideas arrive!
-   ☘️ Donating any amount is a great way to help me work on the projects more regularly!

<p>

  <a href="https://paypal.me/NLKNguyen" target="_blank">
      <img src="https://user-images.githubusercontent.com/4667129/101101433-71b7ff00-357d-11eb-8cf2-3c529960d422.png" height=44 />
  </a>

  <a href="https://www.patreon.com/Nikyle" target="_blank">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" height=44 style="border-radius: 5px;" />
  </a>

  <a href="https://www.buymeacoffee.com/Nikyle" target="_blank">
      <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height=44 />
  </a>

</p>

# 📝 License

Copyright © 2022 [Nikyle Nguyen](https://github.com/NLKNguyen)

The project is [ISC License](https://github.com/NLKNguyen/code-formation/blob/master/LICENSE).

"The ISC license is a permissive free software license published by the Internet Software Consortium, now called Internet Systems Consortium. It is functionally equivalent to the simplified BSD and MIT licenses, but without language deemed unnecessary following the Berne Convention".

This simply means that the project is free to use in any capacity without any warranty while reserving the rights for others to also freely do anything with it.