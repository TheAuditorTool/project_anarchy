"""
Setup.py for python-dependency-nightmare
Contains intentionally conflicting dependency versions for TheAuditor testing
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="python-dependency-nightmare",
    version="1.0.0",
    author="Project Anarchy Team",
    author_email="test@example.com",
    description="A package with conflicting dependency definitions",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/example/python-dependency-nightmare",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    # ERROR 221: Conflicting pandas version (>=2.1.0 vs all others)
    # ERROR 222: Conflicting numpy version (==1.26.0 vs all others)
    install_requires=[
        "pandas>=2.1.0",
        "numpy==1.26.0",
        "requests>=2.30.0",
        "fastapi>=0.103.0",
        "sqlalchemy>=2.0.20",
        "pydantic>=2.0.0",
        "aiohttp>=3.8.0",
        "cryptography>=41.0.0"
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "black>=23.7.0",
            "flake8>=6.0.0",
            "mypy>=1.4.0",
            "coverage>=7.0.0"
        ],
        "docs": [
            "sphinx>=5.0.0",
            "sphinx-rtd-theme>=1.2.0"
        ]
    },
    entry_points={
        "console_scripts": [
            "dep-nightmare=python_dependency_nightmare.cli:main",
        ],
    },
)