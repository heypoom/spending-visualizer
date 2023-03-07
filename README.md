# Statement Visualizer and Parser

Find out how you spend your money! This repo provides libraries and webapp to parse your bank or credit card statements (PDF format) into JSON, and visualize it.

### Supported banks and formats

- Kasikornthai Bank (ธนาคารกสิกรไทย)
  - Credit Card Statement (100%)
  - Bank Statement (60%)

### Planned formats

Please submit pull requests to this repo to build your own parsers!

### Structure

- The parser: `packages/parser` contains the parser files to parse the PDF statements into JSON.
- The visualizer: `apps/visualizer` contains the Solid.js app to visualize statements.
