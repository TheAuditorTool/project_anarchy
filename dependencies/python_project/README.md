# Python Dependency Nightmare

This project intentionally contains conflicting dependency definitions across multiple files for testing TheAuditor's dependency conflict detection capabilities.

## Conflict Summary
- requirements.txt: pandas==1.5.0, numpy<1.24
- pyproject.toml: pandas==2.0.0, numpy>=1.25
- Pipfile: pandas~=1.4.0, numpy=*
- setup.py: pandas>=2.1.0, numpy==1.26.0

All four files specify different and incompatible versions of the same packages.