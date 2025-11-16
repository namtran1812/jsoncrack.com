import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

//copilot: the left-side JSON editor, the graph, and the modal all depend on the entire JSON document
//so when saving changes from the modal, we need to parse the entire JSON, update the relevant path, and then serialize it back
//update JSON at path helper
function updateJsonAtPath(root: any, path: (string | number)[], newObj: any) {
  if (!path || path.length === 0) return;

  let curr = root;
  for (let i = 0; i < path.length - 1; i++) {
    curr = curr[path[i]];
  }

  const last = path[path.length - 1];
  curr[last] = newObj;
}

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);

  const json = useJson(state => state.json);
  //const setJson = useJson(state => state.setJson);
  const setContents = useFile(state => state.setContents);

  //editing state
  //original mode is read-only view
  //tempContent holds the edited text
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState("");

  //Enter edit mode
  //load the existing node data into the textarea
  const handleEnterEdit = () => {
    setTempContent(normalizeNodeData(nodeData?.text ?? []));
    setIsEditing(true);
  };

  //copilot: when saving changes from the modal, we need to parse the entire JSON, update the relevant path, and then serialize it back
  //Save edited content
  //parse tempContent, update the full JSON at nodeData.path, and save back to useJson
  //exit edit mode
  
  //parse their edited JSON
  //parse the full stored JSON
  //patch only the edited part (updateJsonAtPath)
  //push everything back into the global json store
  const handleSave = () => {
    try {
      const parsedNewObj = JSON.parse(tempContent);   //content user edited
      const fullJsonObj = JSON.parse(json);           //entire JSON

      updateJsonAtPath(fullJsonObj, nodeData.path, parsedNewObj);

      //setJson(JSON.stringify(fullJsonObj, null, 2));
      //update left editor, not just internal JSON store
      const newJsonString = JSON.stringify(fullJsonObj, null, 2);
      setContents({
        contents: newJsonString,
        skipUpdate: false,
      });
      setIsEditing(false);
      //close modal after saving
      onClose(); 
    } catch (e) {
      console.error("Save failed:", e);
    }

  };

  //Cancel editing
  //simply exit edit mode without saving
  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">

        {/* CONTENT SECTION */}
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>Content</Text>

            {/* spacer to push buttons to the right */}
            <Flex style={{ flex: 0.5 }} />

            {/* EDIT / SAVE / CANCEL BUTTONS */}
            {/* show Edit button when not editing, Save/Cancel when editing */}
            
            {!isEditing ? (
              <Button size="xs" onClick={handleEnterEdit}>
                Edit
              </Button>
            ) : (
              <Flex gap="xs">
                <Button size="xs" color="green" onClick={handleSave}>
                  Save
                </Button>
                <Button size="xs" color="red" onClick={handleCancel}>
                  Cancel
                </Button>
              </Flex>
            )}

            <CloseButton onClick={onClose} />
          </Flex>

          {/* switch between veiew mode and edit mode */}
          {/* view mode: read-only code highlight */}
          {/* edit mode: textarea for editing, users can directly modify the JSON */}
          {!isEditing ? (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight
                code={normalizeNodeData(nodeData?.text ?? [])}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
          ) : (
            <Textarea
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              autosize
              minRows={6}
              styles={{ input: { fontFamily: "monospace" } }}
            />
          )}
        </Stack>

        {/* JSON PATH SECTION */}
        <Text fz="xs" fw={500}>JSON Path</Text>

        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>

      </Stack>
    </Modal>
  );
};
