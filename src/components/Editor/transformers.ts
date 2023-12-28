import { TextMatchTransformer, TRANSFORMERS as DEFAULT_TRANSFORMERS } from "@lexical/markdown";
import {
  $createEquationNode,
  $isEquationNode,
  EquationNode,
} from "./nodes/EquationNode";

export const EQUATION: TextMatchTransformer = {
  dependencies: [EquationNode],
  export: (node) => {
    if (!$isEquationNode(node)) {
      return null;
    }

    return `$${node.getEquation()}$`;
  },
  importRegExp: /\$([^$]+?)\$/,
  regExp: /\$([^$]+?)\$$/,
  replace: (textNode, match) => {
    const [, equation] = match;
    const equationNode = $createEquationNode(equation, true);
    textNode.replace(equationNode);
  },
  trigger: "$",
  type: "text-match",
};

const TRANSFORMERS = [
  ...DEFAULT_TRANSFORMERS,
  EQUATION,
];

export default TRANSFORMERS;