import React from "react";
import { useComputedColorScheme } from "@mantine/core";
import type { NodeProps } from "reaflow";
import { Node } from "reaflow";
import { useModal } from "../../../../../store/useModal";
import type { NodeData } from "../../../../../types/graph";
import useGraph from "../stores/useGraph";
import { ObjectNode } from "./ObjectNode";
import { TextNode } from "./TextNode";

export interface CustomNodeProps {
  node: NodeData;
  x: number;
  y: number;
  hasCollapse?: boolean;
  parentPath?: Array<string | number>;
}

const CustomNodeWrapper = (nodeProps: NodeProps<NodeData>) => {
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const setVisible = useModal(state => state.setVisible);
  const colorScheme = useComputedColorScheme();

  const handleNodeClick = React.useCallback(
    (_: React.MouseEvent<SVGGElement, MouseEvent>, data: NodeData) => {
      if (setSelectedNode) setSelectedNode(data);
      setVisible("NodeModal", true);
    },
    [setSelectedNode, setVisible]
  );

  return (
    <Node
      {...nodeProps}
      onClick={handleNodeClick as any}
      animated={false}
      label={null as any}
      onEnter={ev => {
        ev.currentTarget.style.stroke = "#3B82F6";
      }}
      onLeave={ev => {
        ev.currentTarget.style.stroke = colorScheme === "dark" ? "#424242" : "#BCBEC0";
      }}
      style={{
        fill: colorScheme === "dark" ? "#292929" : "#ffffff",
        stroke: colorScheme === "dark" ? "#424242" : "#BCBEC0",
        strokeWidth: 1,
      }}
    >
      {({ node, x, y }) => {
        // node may be the Reaflow node properties or the parsed NodeData depending on branch
        const hasKey = nodeProps.properties.text[0].key;

        // parentPath can be stored on the callback "node" or on the original properties
        const parentPath = (node as any)?.path ?? (nodeProps.properties as any)?.path;

        if (!hasKey)
          return (
            <TextNode node={nodeProps.properties as NodeData} x={x} y={y} parentPath={parentPath} />
          );

        return <ObjectNode node={node as NodeData} x={x} y={y} parentPath={parentPath} />;
      }}
    </Node>
  );
};

export const CustomNode = React.memo(CustomNodeWrapper);
