
## Example documentation with diagram in code comments

This documentation is written in C# source code
`3_diagram_in_source_comment.cs`, including the diagram below. The
code-formation `WRITE` instruction points to this Markdown file for writing out
this documentation. This is useful for writing documentation directly in code
comments along with technical diagrams using various diagram languages.

![](./media/3.svg)

The folder `.code-formation` has a script `diagram.js` that introduces `diagram`
snippet which is used by the code-formation instructions in this Markdown file.
This snippet calls [Kroki](https://kroki.io/) web service to render the diagram code in the
code-blocks.

The code-formation instruction sets the `out` to be the same file reference in
the Markdown image tag `![](./media/3.svg)` in the param `sub` which substitutes
the diagram code with Markdown image tag, so the generated diagram image will be
displayed in a Markdown Viewer.
file.

