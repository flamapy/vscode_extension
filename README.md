## Flama - A variability analysis tool written in Python.

Welcome to the flamapy VS extesion.

FlamaPy is a Python-based AAFM framework that takes into consideration previous AAFM tool designs and enables multi-solver and multi-metamodel support for the integration of AAFM tooling on the Python ecosystem. In this case, we are relying on pyodide to eecute part of the already supported operations within vscode and uvl files

The main features of the framework are:
* Easy to extend by enabling the creation of new plugins following a semi-automatic generator approach.
* Support multiple variability models. Currently, it provides support for cardinality-based feature models. However, it is easy to integrate others such as attributed feature models
* Support multiple solvers. Currently, it provides support for the PySAT metasolver, which enables more than ten different solvers.
* Support multiple operations. It is developed, having in mind multi-model operations such as those depicted by Familiar  and single-model operations.

Go to our website for more information [website](https://flamapy.github.io)
In this wiki you'll find the documentation of this project. 

- [1. Installation](https://flamapy.github.io/docs/jekyll/2022-06-12-1-installation.html)
- [2. Usage](https://flamapy.github.io/docs/jekyll/2022-06-12-2-usage.html)
- [3. Development](https://flamapy.github.io/docs/jekyll/2022-06-12-3-development.html)

## Google colab First steps

- [Google colab project](https://colab.research.google.com/drive/1ktuEn2KAqv7dbzeHQc-G_kUxUEW-n_av?usp=sharing)


## Available plugins and related projects
[flamapy-fm](https://github.com/flamapy/fm_metamodel)
[flamapy-sat](https://github.com/flamapy/pysat_metamodel)
[flamapy-bdd](https://github.com/flamapy/bdd_metamodel)

## Changelog
Detailed changes for each release are documented in the [release notes](https://github.com/flamapy/core/releases)

## Contributing

See [CONTRIBUTING.md](https://github.com/flamapy/core/blob/master/CONTRIBUTING.md)