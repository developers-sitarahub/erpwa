"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Workflow,
  Trash2,
  Battery,
  Wifi,
  Signal,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { Button } from "@/components/button";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { toast } from "react-toastify";

interface FlowEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  flow: {
    id: string;
    name: string;
    category: string;
    flowJson: Record<string, unknown>;
    validationErrors?: unknown[];
    status?: string;
  } | null;
  onSave: () => void;
}

const SAMPLE_FLOW_JSON = {
  version: "6.0",
  data_api_version: "3.0",
  routing_model: {
    START: ["SCREEN_B"],
    SCREEN_B: ["SCREEN_C"],
    SCREEN_C: [],
  },
  screens: [
    {
      id: "START",
      title: "Welcome",
      terminal: false,
      layout: {
        type: "SingleColumnLayout",
        children: [
          {
            type: "Form",
            name: "form",
            children: [
              {
                type: "TextHeading",
                text: "Welcome to Jungle",
              },
              {
                type: "Footer",
                label: "Continue",
                "on-click-action": {
                  name: "data_exchange",
                  payload: {
                    next_screen_id: "SCREEN_B",
                  },
                },
              },
            ],
          },
        ],
      },
    },
    {
      id: "SCREEN_B",
      title: "Form",
      terminal: false,
      layout: {
        type: "SingleColumnLayout",
        children: [
          {
            type: "Form",
            name: "form",
            children: [
              {
                type: "TextHeading",
                text: "Fill Info",
              },
              {
                type: "TextInput",
                name: "your_name",
                label: "Your Name",
                required: true,
              },
              {
                type: "TextInput",
                name: "email_id",
                label: "Email ID",
                required: true,
              },
              {
                type: "DatePicker",
                name: "select_date",
                label: "Select Date",
                required: true,
              },
              {
                type: "Dropdown",
                name: "select_option",
                label: "Select Option",
                required: true,
                "data-source": [
                  {
                    id: "opt_a",
                    title: "Opt 1",
                  },
                  {
                    id: "opt_b",
                    title: "Opt 2",
                  },
                ],
              },
              {
                type: "Footer",
                label: "Submit",
                "on-click-action": {
                  name: "data_exchange",
                  payload: {
                    your_name: "${form.your_name}",
                    email_id: "${form.email_id}",
                    select_date: "${form.select_date}",
                    select_option: "${form.select_option}",
                    next_screen_id: "SCREEN_C",
                  },
                },
              },
            ],
          },
        ],
      },
    },
    {
      id: "SCREEN_C",
      title: "Bye",
      terminal: true,
      layout: {
        type: "SingleColumnLayout",
        children: [
          {
            type: "Form",
            name: "form",
            children: [
              {
                type: "TextHeading",
                text: "Thank You",
              },
              {
                type: "Footer",
                label: "Complete",
                "on-click-action": {
                  name: "complete",
                  payload: {},
                },
              },
            ],
          },
        ],
      },
    },
  ],
};

const CATEGORIES = [
  { value: "LEAD_GENERATION", label: "Lead Generation" },
  { value: "APPOINTMENT_BOOKING", label: "Appointment Booking" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "SIGN_IN", label: "Sign In" },
  { value: "CUSTOMER_SUPPORT", label: "Customer Support" },
  { value: "OTHER", label: "Other" },
];

export default function FlowEditorModal({
  isOpen,
  onClose,
  flow,
  onSave,
}: FlowEditorModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "LEAD_GENERATION",
    flowJson: JSON.stringify(SAMPLE_FLOW_JSON, null, 2),
  });
  const [saving, setSaving] = useState(false);
  const [localValidationErrors, setLocalValidationErrors] = useState<Array<Record<string, unknown>>>([]);

  // Helper: Parse JSON back to Screens for Visual Builder
  const parseJSONToScreens = useCallback((json: Record<string, unknown>): FlowScreen[] => {
    if (!json.screens) return []; // Return empty array if invalid

    return (json.screens as Array<Record<string, unknown>>).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      title: String(s.title),
      terminal: Boolean(s.terminal),
      children: parseChildrenToComponents(
        (s.layout as Record<string, unknown> | undefined)?.children as Array<Record<string, unknown>> || [],
        json.routing_model as Record<string, unknown>,
        String(s.id),
      ),
    }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const parseChildrenToComponents = useCallback((
    children: Array<Record<string, unknown>>,
    routingModel: Record<string, unknown> = {},
    currentScreenId: string = "",
  ): FlowComponent[] => {
    return children
      .map((child: Record<string, unknown>, index: number) => {
        const baseId = `c_${Date.now()}_${index}`;
        let type: FlowComponentType = "TextBody"; // Default fallback
        let data: Record<string, unknown> = {};

        if (child.type === "TextHeading") {
          type = "TextHeading";
          data = { text: child.text };
        } else if (child.type === "TextBody") {
          type = "TextBody";
          data = { text: child.text };
        } else if (child.type === "Text") {
          // V5 Generic Text Component Parser
          const textContent = child.text || "";
          // Check for Markdown Bold to infer Heading
          if (typeof textContent === 'string' && textContent.startsWith('*') && textContent.endsWith('*')) {
            type = "TextHeading";
            data = { text: textContent.slice(1, -1) }; // Strip asterisks
          } else {
            type = "TextBody";
            data = { text: textContent };
          }
        } else if (child.type === "TextInput") {
          type = "TextInput";
          data = {
            label: child.label,
            name: child.name,
            required: child.required,
            inputType: child["input-type"] || child["input_type"],
          };
        } else if (child.type === "Dropdown") {
          type = "Dropdown";
          data = {
            label: child.label,
            name: child.name,
            required: child.required,
            options: child.options || child["data-source"] || child["data_source"],
            initialValue: child["initial-value"] || child["initial_value"],
          };
        } else if (child.type === "RadioButtons") {
          type = "RadioButtons";
          data = {
            label: child.label,
            name: child.name,
            required: child.required,
            options: child.options || child["data-source"] || child["data_source"],
            initialValue: child["initial-value"] || child["initial_value"],
          };
        } else if (child.type === "CheckboxGroup") {
          type = "CheckboxGroup";
          data = {
            label: child.label,
            name: child.name,
            required: child.required,
            options: child.options || child["data-source"] || child["data_source"],
            initialValue: child["initial-value"] || child["initial_value"],
          };
        } else if (child.type === "TextSubheading") {
          type = "TextBody"; // Fallback for Subheading
          data = { text: child.text };
        } else if (child.type === "DatePicker") {
          type = "DatePicker";
          data = {
            label: child.label,
            name: child.name,
            required: child.required,
          };
        } else if (child.type === "Footer") {
          type = "Footer";
          data = { label: child.label };
          const action = (child["on-click-action"] || child["on_click_action"]) as Record<string, unknown> | undefined;

          if (action) {
            const actionName = action.name as string | undefined;
            if (actionName === "complete") {
              data.actionType = "complete";
              data.nextScreenId = "";
            } else if (actionName === "data_exchange") {
              data.actionType = "data_exchange";
              // 1. Try payload next_screen_id (V3/5)
              const payload = action.payload as Record<string, unknown> | undefined;
              if (payload && payload.next_screen_id) {
                data.nextScreenId = payload.next_screen_id;
              }
              // 2. Fallback to routing model (V2)
              else {
                const routes = routingModel[currentScreenId] as unknown[] | undefined;
                if (routes && Array.isArray(routes) && routes.length > 0) {
                  data.nextScreenId = routes[0];
                } else {
                  data.nextScreenId = "";
                }
              }
            } else if (actionName === "navigate") {
              data.actionType = "navigate";
              const next = action.next as Record<string, unknown> | undefined;
              data.nextScreenId = next?.name;
            }
          } else {
            // Default
            data.actionType = "navigate";
          }
        } else if (child.type === "Form") {
          // Flatten Form children for this simple builder
          return parseChildrenToComponents(
            (child.children as Array<Record<string, unknown>>) || [],
            routingModel,
            currentScreenId,
          );
        }

        // Handle flattened array return from Form case above
        if (Array.isArray(type)) return type;

        return { id: baseId, type, data };
      })
      .flat();
  }, []);

  useEffect(() => {
    if (flow) {
      setFormData({
        name: flow.name,
        category: flow.category,
        flowJson: JSON.stringify(flow.flowJson, null, 2),
      });
      // Load into Visual Builder
      try {
        if (flow.flowJson) {
          let json = flow.flowJson;
          if (typeof json === "string") {
            try {
              json = JSON.parse(json);
            } catch (e) {
              console.error("Error parsing flowJson string:", e);
            }
          }
          const parsedScreens = parseJSONToScreens(json);
          setScreens(parsedScreens);
          setActiveScreenId(parsedScreens[0]?.id || "START");
        }
      } catch (e) {
        console.error("Failed to parse existing flow for builder", e);
      }
    }
  }, [flow, parseJSONToScreens, parseChildrenToComponents]);

  const validateJSON = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);

      // Basic Flow JSON validation
      if (
        !parsed.version ||
        !parsed.screens ||
        !Array.isArray(parsed.screens)
      ) {
        return "Invalid Flow JSON: missing required fields (version, screens)";
      }

      return parsed;
    } catch {
      return null;
    }
  };



  const handleSave = async (currentJsonString?: string) => {
    try {
      // Always generate JSON from builder since we removed the JSON tab
      const jsonToSave = currentJsonString || generateJSONFromScreens();

      // Validate JSON first
      const parsedJson = validateJSON(jsonToSave);
      if (!parsedJson) {
        toast.error("Invalid Flow JSON");
        return;
      }

      if (!formData.name) {
        toast.error("Flow name is required");
        return;
      }

      // Endpoint is now handled by backend automatically

      setSaving(true);

      const payload = {
        name: formData.name,
        category: formData.category,
        flowJson: parsedJson,
      };

      if (flow) {
        // Update existing Flow
        await api.put(`/whatsapp/flows/${flow.id}`, payload);
        toast.success("Flow updated successfully!");
      } else {
        // Create new Flow
        await api.post("/whatsapp/flows", payload);
        toast.success("Flow created successfully!");
      }

      onSave();
    } catch (error: unknown) {
      console.error("Error saving Flow:", error);
      const err = error as { response?: { data?: { message?: string, validationErrors?: Array<Record<string, unknown>> } } };
      
      // Extract detailed validation errors if available
      const apiErrors = err.response?.data?.validationErrors || [];
      setLocalValidationErrors(apiErrors);
      
      toast.error(err.response?.data?.message || "Failed to save Flow");
    } finally {
      setSaving(false);
    }
  };



  // activeTab is now always "builder" - no need for state or setter


  // --- NEW BUILDER STATE ---
  type FlowComponentType =
    | "TextHeading"
    | "TextBody"
    | "TextInput"
    | "Dropdown"
    | "RadioButtons"
    | "CheckboxGroup"
    | "DatePicker"
    | "Footer";

  interface FlowComponent {
    id: string;
    type: FlowComponentType;
    data: Record<string, unknown>;
  }

  interface FlowScreen {
    id: string;
    title: string;
    terminal: boolean;
    children: FlowComponent[];
  }

  const [screens, setScreens] = useState<FlowScreen[]>([
    {
      id: "START",
      title: "Start Screen",
      terminal: true, // Initial screen is terminal (last screen) by default
      children: [
        { id: "c1", type: "TextHeading", data: { text: "Welcome" } },
        {
          id: "c2",
          type: "Footer",
          data: {
            label: "Complete",
            actionType: "complete", // Proper action type
            nextScreenId: ""
          }
        },
      ],
    },
  ]);

  const [activeScreenId, setActiveScreenId] = useState<string>("START");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );

  // Right sidebar visibility


  // Inline editing state - for editing text directly in preview
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>("");



  // Synchronize Footer action types based on screen content
  useEffect(() => {
    if (!selectedComponentId) return;

    const activeScreen = screens.find(s => s.id === activeScreenId);
    if (!activeScreen) return;

    const selectedComponent = activeScreen.children.find(c => c.id === selectedComponentId);
    if (!selectedComponent || selectedComponent.type !== "Footer") return;

    // Determine enforced action type based on screen content
    const isTerminal = activeScreen.terminal;

    let enforcedType = "";
    let isLocked = false;

    if (isTerminal) {
      enforcedType = "complete";
      isLocked = true;
    } else {
      // Force ALL non-terminal screens to use data_exchange (server submit)
      enforcedType = "data_exchange";
      isLocked = true;
    }

    if (isLocked) {
      const updates: Record<string, unknown> = {};
      // 1. Sync forced action type
      if (enforcedType !== selectedComponent.data.actionType) {
        updates.actionType = enforcedType;
      }
      // 2. Auto-select next screen if missing and not terminal
      if (!isTerminal && !selectedComponent.data.nextScreenId) {
        const currentIndex = screens.findIndex(s => s.id === activeScreenId);
        if (currentIndex !== -1 && currentIndex < screens.length - 1) {
          updates.nextScreenId = screens[currentIndex + 1].id;
        }
      }

      if (Object.keys(updates).length > 0) {
        updateComponent(selectedComponentId, updates);
      }
    }
  }, [selectedComponentId, activeScreenId, screens]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- JSON GENERATION ---
  const generateJSONFromScreens = () => {
    if (!screens.length) return "";

    // 1. Sanitize IDs - Meta requires ONLY alphabets and underscores (NO NUMBERS)
    const screenIdMap = new Map<string, string>();
    const toAlphaIdentifier = (idx: number): string => {
      // Convert index to letter-based: 0=A, 1=B, ..., 25=Z, 26=AA, etc.
      let result = '';
      let n = idx;
      do {
        result = String.fromCharCode(65 + (n % 26)) + result;
        n = Math.floor(n / 26) - 1;
      } while (n >= 0);
      return result;
    };

    const validScreens = screens.map((screen, sIdx) => {
      // Strip numbers from screen ID, keep only letters and underscores
      let validId = screen.id.trim().replace(/[^A-Za-z_]/g, '').toUpperCase();
      if (!validId || validId.length === 0) {
        validId = sIdx === 0 ? 'START' : `SCREEN_${toAlphaIdentifier(sIdx)}`;
      }
      let uniqueId = validId;
      let counter = 0;
      while (Array.from(screenIdMap.values()).includes(uniqueId)) {
        counter++;
        uniqueId = `${validId}_${toAlphaIdentifier(counter)}`;
      }
      screenIdMap.set(screen.id, uniqueId);
      return { ...screen, id: uniqueId };
    });

    // 2. Process Screens
    const processedScreens = validScreens.map((screen, sIdx) => {
      // Deduplicate Field Names within screen
      const usedNames = new Set<string>();
      const getUniqueName = (baseName: string) => {
        // Meta requires: Starts with letter, lowercase, no special characters except underscore
        let name = baseName ? baseName.toLowerCase().replace(/[^a-z0-9_]/g, '') : "field";
        if (!name || name.length === 0) {
          name = "field";
        }
        // Ensure starts with letter
        if (!/^[a-z]/.test(name)) {
          name = "f_" + name;
        }
        let unique = name;
        let suffix = 'a';
        while (usedNames.has(unique)) {
          unique = `${name}_${suffix}`;
          suffix = String.fromCharCode(suffix.charCodeAt(0) + 1);
        }
        usedNames.add(unique);
        return unique;
      };

      const childrenJson = screen.children.map((comp) => {
        if (["TextInput", "Dropdown", "RadioButtons", "CheckboxGroup", "DatePicker"].includes(comp.type)) {
          const uniqueName = getUniqueName(String(comp.data.name || ''));

          if (comp.type === "TextInput") {
            const label = String(comp.data.label || "Input").trim() || "Input";
            const textInputObj: Record<string, unknown> = {
              type: "TextInput",
              name: uniqueName,
              label: label,
              required: !!comp.data.required,
            };
            if (comp.data.inputType && comp.data.inputType !== "text") {
              textInputObj["input-type"] = comp.data.inputType;
            }
            return textInputObj;
          }
          if (comp.type === "DatePicker") {
            const label = String(comp.data.label || "Date").trim() || "Date";
            return {
              type: "DatePicker",
              name: uniqueName,
              label: label,
              required: comp.data.required,
            };
          }
          // Options based - ensure unique IDs with letter suffixes (no numbers allowed)
          const toOptLetter = (i: number) => String.fromCharCode(97 + i); // a, b, c...
          const rawOptions = comp.data.options;
          
          let options;
          if (typeof rawOptions === "string" && rawOptions.startsWith("${")) {
            options = rawOptions; // Handle dynamic references like ${data.options}
          } else {
            const optsArray = Array.isArray(rawOptions) && rawOptions.length > 0
              ? rawOptions
              : [{ id: "option_a", title: "Option A" }, { id: "option_b", title: "Option B" }];

            const usedOptIds = new Set<string>();
            options = optsArray.map((opt: { id?: string; title?: string; label?: string }, idx: number) => {
              // Always generate unique ID with letter suffix to avoid duplicates
              const baseId = `opt_${toOptLetter(idx)}`;
              let finalId = baseId;
              let suffix = 0;
              while (usedOptIds.has(finalId)) {
                suffix++;
                finalId = `${baseId}${toOptLetter(suffix)}`;
              }
              usedOptIds.add(finalId);

              const title = (opt.title || opt.label || `Option ${toOptLetter(idx).toUpperCase()}`).trim();
              return {
                id: finalId,
                title: title || `Option ${toOptLetter(idx).toUpperCase()}`
              };
            });
          }

          // Meta V6.0 Type and Property Names:
          // RadioButtons -> RadioButtonsGroup
          // Dropdown, RadioButtonsGroup, CheckboxGroup -> data-source
          const finalType = comp.type === "RadioButtons" ? "RadioButtonsGroup" : comp.type;
          
          const jsonComp: Record<string, unknown> = {
            type: finalType,
            name: uniqueName,
            label: String(comp.data.label || "Select").trim() || "Select",
            required: !!comp.data.required,
            initial_value: comp.data.initialValue || undefined,
            "data-source": options // Unified property for V6.0+
          };

          return jsonComp;
        }

        // Non-input components
        switch (comp.type) {
          case "TextHeading":
            // V6.0: text cannot be empty
            const headingText = String(comp.data.text || "").trim();
            if (!headingText) return null; // Skip empty headings
            return {
              type: "TextHeading",
              text: headingText
            };
          case "TextBody":
            // V6.0: text cannot be empty
            const bodyText = String(comp.data.text || "").trim();
            if (!bodyText) return null; // Skip empty body text
            return {
              type: "TextBody",
              text: bodyText
            };
          case "Footer":
            // Footer Logic
            let action: { name: string; payload?: Record<string, string> | Record<string, never>; next?: { name: string } } = { name: "navigate" };
            const actionType = comp.data.actionType || "navigate";

            // Resolve target ID
            let nextScreenId = comp.data.nextScreenId ? screenIdMap.get(String(comp.data.nextScreenId)) : "";

            // Auto-next screen if not set and not terminal
            if (!nextScreenId && !screen.terminal && sIdx < validScreens.length - 1) {
              nextScreenId = validScreens[sIdx + 1].id;
            }

            if (screen.terminal) {
              action = { name: "complete", payload: {} };
            } else if (actionType === "complete") {
              action = { name: "complete", payload: {} };
            } else {
              // data_exchange for everything else (non-terminal)
              const payload: Record<string, string> = {};
              const tempNames = new Set<string>();
              const tempGetUnique = (n: string) => {
                let name = n ? n.toLowerCase().replace(/[^a-z0-9_]/g, '') : "field";
                // Ensure starts with letter (matching getUniqueName)
                if (!/^[a-z]/.test(name)) {
                  name = "f_" + name;
                }
                let unique = name;
                let i = 1;
                while (tempNames.has(unique)) unique = `${name}_${i++}`;
                tempNames.add(unique);
                return unique;
              };

              screen.children.forEach(c => {
                if (["TextInput", "Dropdown", "RadioButtons", "CheckboxGroup", "DatePicker"].includes(c.type)) {
                  const fName = tempGetUnique(String(c.data.name || ''));
                  payload[fName] = `\${form.${fName}}`;
                }
              });

              // next_screen_id is required by backend for routing
              if (nextScreenId) {
                payload.next_screen_id = nextScreenId;
              }
              action = { name: "data_exchange", payload };
            }

            return {
              type: "Footer",
              label: String(comp.data.label || "Continue").trim() || "Continue",
              "on-click-action": action
            };
          default:
            return null;
        }
      }).filter(Boolean);

      // V6.0: Ensure screen title is not empty
      const screenTitle = (screen.title || "").trim() || `Screen ${sIdx + 1}`;

      return {
        id: screen.id,
        title: screenTitle,
        terminal: screen.terminal,


        layout: {
          type: "SingleColumnLayout",
          children: [
            {
              type: "Form",
              name: "form",
              children: childrenJson,
            }
          ],
        },
      };
    });

    // Build routing_model - define forward routes for data_exchange flows
    // Each screen maps to an array of screens it can navigate to
    const routing_model: Record<string, string[]> = {};

    validScreens.forEach((screen, sIdx) => {
      const routes: string[] = [];

      // Only add forward routes if it's not a terminal screen
      if (!screen.terminal) {
        // Find the Footer component logic
        const footer = screen.children.find(c => c.type === "Footer");
        const actionType = footer?.data?.actionType || "navigate";

        // Terminal or "complete" actions don't have forward routes
        if (actionType !== "complete") {
          let nextScreenId = footer?.data?.nextScreenId ? screenIdMap.get(String(footer.data.nextScreenId)) : "";
          
          if (!nextScreenId && sIdx < validScreens.length - 1) {
            nextScreenId = validScreens[sIdx + 1].id;
          }

          if (nextScreenId) {
            routes.push(nextScreenId);
          }
        }
      }

      routing_model[screen.id] = routes;
    });

    const flow = {
      version: "6.0",
      data_api_version: "3.0",
      routing_model,
      screens: processedScreens,
    };

    const jsonString = JSON.stringify(flow, null, 2);
    console.log("🔍 Generated Flow JSON:", jsonString);
    setFormData((prev) => ({ ...prev, flowJson: jsonString }));
    return jsonString;
  };

  // --- ACTIONS ---
  // Helper to convert index to letter: 0=A, 1=B, ...
  const toAlpha = (idx: number): string => {
    let result = '';
    let n = idx;
    do {
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return result;
  };

  const addScreen = () => {
    let suffixIdx = screens.length;
    let id = `SCREEN_${toAlpha(suffixIdx)}`;
    while (screens.some((s) => s.id === id)) {
      suffixIdx++;
      id = `SCREEN_${toAlpha(suffixIdx)}`;
    }

    // Title is user-friendly with number
    const screenTitle = `Screen ${screens.length + 1}`;

    const newScreen: FlowScreen = {
      id,
      title: screenTitle,
      terminal: true, // New screen is last, so mark as terminal by default
      children: [
        {
          id: Math.random().toString(36).substr(2, 9),
          type: "TextHeading",
          data: { text: screenTitle }
        },
        {
          id: Math.random().toString(36).substr(2, 9),
          type: "Footer",
          data: {
            label: "Complete",
            actionType: "complete", // Last screen completes the flow
            nextScreenId: ""
          }
        }
      ],
    };

    // Auto-link: Update the CURRENT active screen's Footer to navigate to this new screen
    // Also un-mark it as terminal since it's no longer the last screen
    const previousScreenId = activeScreenId;

    setScreens((prevScreens) => {
      const updatedScreens = prevScreens.map((s) => {
        if (s.id === previousScreenId) {
          // Update Footer to point to new screen + use data_exchange for form submission
          // Also mark as non-terminal since there's a next screen now
          return {
            ...s,
            terminal: false, // No longer the last screen
            children: s.children.map((c) => {
              if (c.type === "Footer") {
                // Check if screen has form inputs - if so, use data_exchange
                const hasFormInputs = s.children.some((child) =>
                  ["TextInput", "Dropdown", "RadioButtons", "CheckboxGroup", "DatePicker"].includes(child.type)
                );

                return {
                  ...c,
                  data: {
                    ...c.data,
                    // Use data_exchange if there are form inputs, otherwise navigate
                    actionType: hasFormInputs ? "data_exchange" : "navigate",
                    nextScreenId: id,
                    label: hasFormInputs ? "Submit & Continue" : "Continue",
                  },
                };
              }
              return c;
            }),
          };
        }
        return s;
      });
      return [...updatedScreens, newScreen];
    });

    setActiveScreenId(id);
  };

  const updateScreen = (screenId: string, data: Partial<FlowScreen>) => {
    setScreens(screens.map(s => s.id === screenId ? { ...s, ...data } : s));
  };

  const deleteScreen = (id: string) => {
    if (screens.length <= 1) return; // Cannot delete the only screen
    setScreens(screens.filter((s) => s.id !== id));
    if (activeScreenId === id) setActiveScreenId(screens[0].id);
  };

  // Helper: Convert label to valid field name (snake_case, lowercase)
  const labelToFieldName = useCallback((label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      || 'field';
  }, []);

  const addComponent = (type: FlowComponentType) => {
    // Generate smart default labels based on component type
    const getDefaultLabel = (compType: FlowComponentType): string => {
      switch (compType) {
        case "TextInput": return "Your Name";
        case "Dropdown": return "Select Option";
        case "RadioButtons": return "Choose One";
        case "CheckboxGroup": return "Select All That Apply";
        case "DatePicker": return "Select Date";
        case "TextHeading": return "Heading";
        case "TextBody": return "";
        default: return "New Component";
      }
    };

    const defaultLabel = getDefaultLabel(type);
    const defaultFieldName = labelToFieldName(defaultLabel);

    // Get current screen info for Footer logic
    const currentScreen = screens.find((s) => s.id === activeScreenId);
    const isTerminal = currentScreen?.terminal || false;
    const hasFormInputs = currentScreen?.children.some((c) =>
      ["TextInput", "Dropdown", "RadioButtons", "CheckboxGroup", "DatePicker"].includes(c.type)
    ) || false;

    // Determine Footer action type based on screen position
    const getFooterDefaults = () => {
      if (isTerminal) {
        // Terminal screen = Complete flow
        return {
          label: "Complete",
          actionType: "complete",
          nextScreenId: "",
        };
      } else if (hasFormInputs) {
        // Non-terminal with form inputs = Submit & navigate
        return {
          label: "Submit & Continue",
          actionType: "data_exchange",
          nextScreenId: "",
        };
      } else {
        // Non-terminal without inputs = Just navigate
        return {
          label: "Continue",
          actionType: "navigate",
          nextScreenId: "",
        };
      }
    };

    const newComp: FlowComponent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data:
        type === "Footer"
          ? getFooterDefaults()
          : type === "TextHeading" || type === "TextBody"
            ? {
              text: defaultLabel,
            }
            : {
              label: defaultLabel,
              name: defaultFieldName, // Field name matches label
              required: true,
              options: type === "Dropdown" || type === "RadioButtons" || type === "CheckboxGroup"
                ? [{ id: "option_1", title: "Option 1" }, { id: "option_2", title: "Option 2" }]
                : undefined,
            },
    };

    // Check if this is a form input type
    const isFormInput = ["TextInput", "Dropdown", "RadioButtons", "CheckboxGroup", "DatePicker"].includes(type);

    setScreens(
      screens.map((s) => {
        if (s.id === activeScreenId) {
          let updatedChildren = [...s.children];
          const footerIdx = updatedChildren.findIndex(c => c.type === "Footer");
          if (footerIdx !== -1) {
            updatedChildren.splice(footerIdx, 0, newComp);
          } else {
            updatedChildren.push(newComp);
          }

          // If adding a form input, auto-update Footer to use data_exchange
          // BUT only if it's not a terminal screen (terminal screens should complete, not exchange)
          if (isFormInput && !isTerminal) {
            updatedChildren = updatedChildren.map((c) => {
              if (c.type === "Footer" && c.data.actionType !== "data_exchange") {
                return {
                  ...c,
                  data: {
                    ...c.data,
                    actionType: "data_exchange",
                    label: c.data.nextScreenId ? "Submit & Continue" : "Submit",
                  },
                };
              }
              return c;
            });
            // Footer automatically set to submit data
          }

          return { ...s, children: updatedChildren };
        }
        return s;
      }),
    );
  };

  const updateComponent = useCallback((compId: string, data: Record<string, unknown>) => {
    setScreens(
      screens.map((s) => {
        if (s.id === activeScreenId) {
          return {
            ...s,
            children: s.children.map((c) => {
              if (c.id === compId) {
                const isFormInput = ["TextInput", "Dropdown", "RadioButtons", "CheckboxGroup", "DatePicker"].includes(c.type);

                // Auto-sync field name when label is changed for form inputs
                const updatedData = { ...c.data, ...data };
                if (isFormInput && data.label && !data.name) {
                  // Only auto-update name if user changed label but not name
                  updatedData.name = labelToFieldName(String(data.label));
                }

                return { ...c, data: updatedData };
              }
              return c;
            }),
          };
        }
        return s;
      }),
    );
  }, [screens, activeScreenId, labelToFieldName]);

  const deleteComponent = (compId: string) => {
    setScreens(
      screens.map((s) => {
        if (s.id === activeScreenId) {
          return { ...s, children: s.children.filter((c) => c.id !== compId) };
        }
        return s;
      }),
    );
    setSelectedComponentId(null);
  };

  // Move component up in the list
  const moveComponentUp = (compId: string) => {
    setScreens(
      screens.map((s) => {
        if (s.id === activeScreenId) {
          const index = s.children.findIndex((c) => c.id === compId);
          if (index <= 0) return s; // Already at top
          const newChildren = [...s.children];
          [newChildren[index - 1], newChildren[index]] = [newChildren[index], newChildren[index - 1]];
          return { ...s, children: newChildren };
        }
        return s;
      }),
    );
  };

  // Move component down in the list
  const moveComponentDown = (compId: string) => {
    setScreens(
      screens.map((s) => {
        if (s.id === activeScreenId) {
          const index = s.children.findIndex((c) => c.id === compId);
          if (index < 0 || index >= s.children.length - 1) return s; // Already at bottom
          const newChildren = [...s.children];
          [newChildren[index], newChildren[index + 1]] = [newChildren[index + 1], newChildren[index]];
          return { ...s, children: newChildren };
        }
        return s;
      }),
    );
  };



  // UI Helpers
  const activeScreenContext = screens.find((s) => s.id === activeScreenId);
  const selectedComponentContext = activeScreenContext?.children.find(
    (c) => c.id === selectedComponentId,
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card w-full max-w-5xl h-[90vh] rounded-xl shadow-xl border border-border flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Workflow className="w-5 h-5 text-primary" />
                {flow?.status === "PUBLISHED" || flow?.status === "DEPRECATED" ? "View Form" : flow ? "Edit Form" : "Create New Form"}
              </h2>
              <div className="flex items-center gap-2">

                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border bg-card">
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input
                  className="w-full px-3 py-2 bg-background border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={flow?.status === "PUBLISHED" || flow?.status === "DEPRECATED"}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 bg-background border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  disabled={flow?.status === "PUBLISHED" || flow?.status === "DEPRECATED"}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>


            {/* Builder Tab - Single Tab, No Need for Tabs UI */}

            <div className="flex-1 overflow-hidden flex">
              {/* VISUAL BUILDER */}
              <div className="flex bg-muted/5 h-full overflow-hidden w-full">
                  {/* 1. LEFT SIDEBAR: SCREEN MANAGER */}
                  <div className="w-64 bg-card border-r border-border flex flex-col shrink-0">
                    <div className="p-4 border-b border-border bg-muted/20">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Screens
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {screens.map((s) => {
                        // Find what this screen navigates to
                        const footer = s.children.find((c) => c.type === "Footer");
                        const nextScreenId = footer?.data?.nextScreenId;
                        const actionType = footer?.data?.actionType || "complete";
                        const nextScreen = screens.find((scr) => scr.id === nextScreenId);

                        return (
                          <div key={s.id}>
                            <div
                              onClick={() => {
                                setActiveScreenId(s.id);
                                setSelectedComponentId(null);
                              }}
                              className={`p-3 rounded-lg text-sm font-medium cursor-pointer flex justify-between items-center group transition-colors ${activeScreenId === s.id ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted text-muted-foreground"}`}
                            >
                              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <span className="truncate">{s.title}</span>
                                {/* Navigation Indicator */}
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {s.terminal ? (
                                    <span className="text-orange-500">🏁 Terminal</span>
                                  ) : actionType === "complete" ? (
                                    <span className="text-green-600">✓ Completes Flow</span>
                                  ) : nextScreen ? (
                                    <span className="text-blue-500">→ {nextScreen.title}</span>
                                  ) : actionType === "data_exchange" ? (
                                    <span className="text-purple-500">📤 Server Submit</span>
                                  ) : (
                                    <span className="text-red-400">⚠ No target</span>
                                  )}
                                </span>
                              </div>
                              {screens.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteScreen(s.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-3 border-t border-border space-y-4">
                      <Button
                        variant="outline"
                        className="w-full text-xs"
                        onClick={addScreen}
                      >
                        + Add Screen
                      </Button>


                    </div>
                  </div>

                  {/* 2. CENTER: CANVAS (PHONE) */}
                  {/* 2. CENTER: CANVAS (PHONE) */}
                  <div className="flex-1 overflow-y-auto bg-muted/10 flex flex-col items-center p-4 relative">
                    {/* Validation Errors Panel */}
                    {localValidationErrors.length > 0 && (
                      <div className="w-full max-w-100 mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs shadow-sm animate-in fade-in slide-in-from-top-2 z-30">
                        <div className="font-bold flex items-center gap-2 mb-1">
                          <Trash2 className="w-3 h-3" />
                          Meta Flow Validation Errors ({localValidationErrors.length})
                          <button 
                            onClick={() => setLocalValidationErrors([])}
                            className="ml-auto text-red-500 hover:text-red-700 transition-colors"
                            title="Dismiss errors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 max-h-37.5 overflow-y-auto">
                          {localValidationErrors.map((err, i) => (
                            <li key={i}>
                              <span className="font-semibold">{String(err.message || 'Validation error')}</span>
                              {err.path ? <span className="opacity-70 mx-1 font-mono">[{String(err.path)}]</span> : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Mobile Frame - Scaled for fit */}
                    {/* Mobile Frame - Scaled for fit, centered via margin */}
                    <div className="w-[320px] h-160 bg-background border-[6px] border-zinc-800 rounded-[3rem] shadow-2xl relative flex flex-col shrink-0 scale-90 origin-center overflow-hidden my-auto">
                      {/* Status Bar */}
                      <div className="bg-zinc-100 h-6 flex items-center justify-between px-5 text-[10px] font-medium border-b shrink-0 select-none text-zinc-900">
                        <span>9:41</span>
                        <div className="flex gap-1 text-zinc-900">
                          <Signal className="w-2.5 h-2.5" />
                          <Wifi className="w-2.5 h-2.5" />
                          <Battery className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      {/* WhatsApp Header */}
                      <div className="bg-[#008069] text-white px-4 py-2 flex items-center gap-3 shadow-md z-10 shrink-0 select-none">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                          A
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold leading-none">
                            Flow Builder
                          </div>
                          <div className="text-[10px] opacity-80 mt-0.5">
                            WhatsApp Flows
                          </div>
                        </div>
                      </div>

                      {/* Screen Content Canvas */}
                      <div className="flex-1 bg-[#efeae2] p-3 overflow-y-auto relative scrollbar-hide">
                        {/* The Flow UI Container - FORCE LIGHT MODE for preview accuracy */}
                        <div className="bg-white rounded-lg shadow-sm min-h-75 flex flex-col relative overflow-hidden text-zinc-900">
                          {/* Screen Header */}
                          <div className="h-10 border-b flex items-center justify-between px-3 shrink-0 bg-white z-10 sticky top-0">
                            <X className="w-4 h-4 opacity-50 text-zinc-600" />
                            {inlineEditId === "screen_title" ? (
                              <div className="flex flex-col items-center">
                                <input
                                  type="text"
                                  autoFocus
                                  className="font-semibold text-xs text-center text-zinc-900 bg-white border-b border-primary outline-none max-w-37.5"
                                  value={inlineEditValue}
                                  onChange={(e) => setInlineEditValue(e.target.value)}
                                  onBlur={() => {
                                    if (activeScreenContext) {
                                      updateScreen(activeScreenContext.id, { title: inlineEditValue });
                                    }
                                    setInlineEditId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      if (activeScreenContext) {
                                        updateScreen(activeScreenContext.id, { title: inlineEditValue });
                                      }
                                      setInlineEditId(null);
                                    }
                                    if (e.key === "Escape") setInlineEditId(null);
                                  }}
                                />
                                <span className="text-[9px] text-zinc-400 font-mono">{activeScreenContext?.id}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center group/title cursor-pointer"
                                onDoubleClick={() => {
                                  setInlineEditId("screen_title");
                                   setInlineEditValue((activeScreenContext?.title as string) || "");
                                }}
                                title="Double-click to rename screen"
                              >
                                <span className="font-semibold text-xs truncate max-w-37.5 text-zinc-900 hover:text-primary transition-colors">
                                  {activeScreenContext?.title}
                                </span>
                                <span className="text-[9px] text-zinc-400 font-mono group-hover/title:text-zinc-600 transition-colors">
                                  {activeScreenContext?.id}
                                </span>
                              </div>
                            )}
                            <div className="w-4" />
                          </div>

                          {/* Components List */}
                          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                            {activeScreenContext?.children.length === 0 && (
                              <div className="text-center py-10 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                                <p className="font-semibold mb-1">Empty Screen</p>
                                <p>Add components from the right panel</p>
                              </div>
                            )}
                            {activeScreenContext?.children && activeScreenContext.children.length > 0 && (
                              <div className="text-[9px] text-center text-zinc-400 -mt-2 mb-2">
                                💡 Double-click text to edit inline
                              </div>
                            )}

                            {activeScreenContext?.children.map((comp, compIndex) => (
                              <div
                                key={comp.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedComponentId(comp.id);
                                }}
                                className={`relative group cursor-pointer transition-all ${selectedComponentId === comp.id ? "ring-2 ring-primary bg-primary/5 rounded px-2 -mx-2 py-2 -my-2" : ""}`}
                              >
                                {/* Component Action Buttons - Show when selected */}
                                {selectedComponentId === comp.id && (
                                  <div className="absolute -right-1 top-0 flex flex-col gap-0.5 z-20">
                                    {compIndex > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveComponentUp(comp.id);
                                        }}
                                        className="w-5 h-5 rounded bg-zinc-700 text-white flex items-center justify-center text-[10px] hover:bg-zinc-600 transition-colors"
                                        title="Move Up"
                                      >
                                        ↑
                                      </button>
                                    )}
                                    {compIndex < (activeScreenContext?.children.length || 0) - 1 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveComponentDown(comp.id);
                                        }}
                                        className="w-5 h-5 rounded bg-zinc-700 text-white flex items-center justify-center text-[10px] hover:bg-zinc-600 transition-colors"
                                        title="Move Down"
                                      >
                                        ↓
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteComponent(comp.id);
                                      }}
                                      className="w-5 h-5 rounded bg-red-500 text-white flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors"
                                      title="Delete"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                                {/* Render Component */}
                                {comp.type === "TextHeading" && (
                                  inlineEditId === comp.id ? (
                                    <input
                                      type="text"
                                      autoFocus
                                      className="text-lg font-bold text-zinc-900 bg-white border-b-2 border-primary outline-none w-full"
                                      value={inlineEditValue}
                                      onChange={(e) => setInlineEditValue(e.target.value)}
                                      onBlur={() => {
                                        updateComponent(comp.id, { text: inlineEditValue });
                                        setInlineEditId(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          updateComponent(comp.id, { text: inlineEditValue });
                                          setInlineEditId(null);
                                        }
                                        if (e.key === "Escape") {
                                          setInlineEditId(null);
                                        }
                                      }}
                                    />
                                  ) : (
                                    <h1
                                      className="text-lg font-bold text-zinc-900 hover:bg-primary/10 rounded px-1 -mx-1 cursor-text"
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setInlineEditId(comp.id);
                                        setInlineEditValue((comp.data.text as string) || "");
                                      }}
                                      title="Double-click to edit"
                                    >
                                      {String(comp.data.text || "Click to edit")}
                                    </h1>
                                  )
                                )}
                                {comp.type === "TextBody" && (
                                  inlineEditId === comp.id ? (
                                    <textarea
                                      autoFocus
                                      className="text-sm text-zinc-500 bg-white border border-primary outline-none w-full min-h-15 rounded p-1"
                                      value={inlineEditValue}
                                      onChange={(e) => setInlineEditValue(e.target.value)}
                                      onBlur={() => {
                                        updateComponent(comp.id, { text: inlineEditValue });
                                        setInlineEditId(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                          setInlineEditId(null);
                                        }
                                      }}
                                    />
                                  ) : (
                                    <p
                                      className="text-sm text-zinc-500 whitespace-pre-wrap hover:bg-primary/10 rounded px-1 -mx-1 cursor-text"
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setInlineEditId(comp.id);
                                        setInlineEditValue((comp.data.text as string) || "");
                                      }}
                                      title="Double-click to edit"
                                    >
                                      {String(comp.data.text || "Click to edit")}
                                    </p>
                                  )
                                )}

                                {(comp.type === "TextInput" ||
                                  comp.type === "DatePicker") && (
                                    <div className="space-y-1">
                                      {inlineEditId === `${comp.id}_label` ? (
                                        <input
                                          type="text"
                                          autoFocus
                                          className="text-xs font-bold text-zinc-500 bg-white border-b border-primary outline-none w-full"
                                          value={inlineEditValue}
                                          onChange={(e) => setInlineEditValue(e.target.value)}
                                          onBlur={() => {
                                            updateComponent(comp.id, { label: inlineEditValue });
                                            setInlineEditId(null);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              updateComponent(comp.id, { label: inlineEditValue });
                                              setInlineEditId(null);
                                            }
                                            if (e.key === "Escape") setInlineEditId(null);
                                          }}
                                        />
                                      ) : (
                                        <div className="flex items-center justify-between">
                                          <label
                                            className="text-xs font-bold text-zinc-500 flex gap-0.5 hover:bg-primary/10 rounded px-1 -mx-1 cursor-text"
                                            onDoubleClick={(e) => {
                                              e.stopPropagation();
                                              setInlineEditId(`${comp.id}_label`);
                                              setInlineEditValue(String(comp.data.label || ""));
                                            }}
                                            title="Double-click to edit label"
                                          >
                                            {String(comp.data.label)}{" "}
                                            {comp.data.required ? (
                                              <span className="text-red-500">*</span>
                                            ) : null}
                                          </label>
                                          {/* Show field name */}
                                          <span className="text-[9px] text-zinc-400 font-mono bg-zinc-100 px-1 rounded" title="Field name in JSON/CSV">
                                            {String(comp.data.name || "field")}
                                          </span>
                                        </div>
                                      )}
                                      <div className="h-10 w-full bg-transparent border border-zinc-300 rounded-lg px-3 flex items-center text-sm text-zinc-400">
                                        {comp.type === "TextInput" ? (
                                          <span className="truncate">
                                            {String(comp.data.text ||
                                              `Enter ${comp.data.label}`)}
                                          </span>
                                        ) : (
                                          "DD/MM/YYYY"
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {(comp.type === "Dropdown" ||
                                  comp.type === "RadioButtons" ||
                                  comp.type === "CheckboxGroup") && (
                                    <div className="space-y-1">
                                      {inlineEditId === `${comp.id}_label` ? (
                                        <input
                                          type="text"
                                          autoFocus
                                          className="text-xs font-bold text-zinc-500 bg-white border-b border-primary outline-none w-full"
                                          value={inlineEditValue}
                                          onChange={(e) => setInlineEditValue(e.target.value)}
                                          onBlur={() => {
                                            updateComponent(comp.id, { label: inlineEditValue });
                                            setInlineEditId(null);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              updateComponent(comp.id, { label: inlineEditValue });
                                              setInlineEditId(null);
                                            }
                                            if (e.key === "Escape") setInlineEditId(null);
                                          }}
                                        />
                                      ) : (
                                        <div className="flex items-center justify-between">
                                          <label
                                            className="text-xs font-bold text-zinc-500 flex gap-0.5 hover:bg-primary/10 rounded px-1 -mx-1 cursor-text"
                                            onDoubleClick={(e) => {
                                              e.stopPropagation();
                                              setInlineEditId(`${comp.id}_label`);
                                              setInlineEditValue(String(comp.data.label || ""));
                                            }}
                                            title="Double-click to edit label"
                                          >
                                            {String(comp.data.label)}{" "}
                                            {comp.data.required ? (
                                              <span className="text-red-500">*</span>
                                            ) : null}
                                          </label>
                                          <span className="text-[9px] text-zinc-400 font-mono bg-zinc-100 px-1 rounded">
                                            {String(comp.data.name || "field")}
                                          </span>
                                        </div>
                                      )}

                                      {/* Options List with Inline Editing */}
                                      <div className="space-y-2 pt-1">
                                        {(comp.data.options as Array<{ id: string; title: string; label?: string }> || []).map((opt, optIdx: number) => (
                                          <div
                                            key={opt.id}
                                            className="flex items-center gap-2 group/opt relative"
                                          >
                                            <div
                                              className={`w-4 h-4 border border-zinc-400 ${comp.type === "RadioButtons" ? "rounded-full" : "rounded-sm"} flex items-center justify-center shrink-0`}
                                            >
                                              {comp.type === "CheckboxGroup" && <div className="w-2.5 h-2.5" />}
                                              {comp.type === "RadioButtons" && <div className="w-2 h-2 rounded-full" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                              {inlineEditId === `opt_${opt.id}` ? (
                                                <input
                                                  autoFocus
                                                  className="w-full text-sm p-0 m-0 border-b border-primary outline-none bg-transparent"
                                                  value={inlineEditValue}
                                                  onChange={(e) => setInlineEditValue(e.target.value)}
                                                  onBlur={() => {
                                                    const newOpts = [...((comp.data.options as Array<Record<string, unknown>>) || [])];
                                                    newOpts[optIdx] = { ...newOpts[optIdx], title: inlineEditValue };
                                                    updateComponent(comp.id, { options: newOpts });
                                                    setInlineEditId(null);
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      const newOpts = [...((comp.data.options as Array<Record<string, unknown>>) || [])];
                                                      newOpts[optIdx] = { ...newOpts[optIdx], title: inlineEditValue };
                                                      updateComponent(comp.id, { options: newOpts });
                                                      setInlineEditId(null);
                                                    }
                                                    if (e.key === 'Escape') setInlineEditId(null);
                                                  }}
                                                />
                                              ) : (
                                                <span
                                                  className="text-sm text-zinc-700 hover:bg-primary/5 cursor-text px-1 -mx-1 rounded block truncate"
                                                  onDoubleClick={(e) => {
                                                    e.stopPropagation();
                                                     setInlineEditId(`opt_${opt.id}`);
                                                     setInlineEditValue((opt.title as string) || "");
                                                   }}
                                                  title="Double-click to edit option"
                                                >
                                                  {opt.title || opt.id}
                                                </span>
                                              )}
                                            </div>

                                            {/* Remove Option Button */}
                                            <button
                                              className="opacity-0 group-hover/opt:opacity-100 p-0.5 text-zinc-400 hover:text-red-500 transition-opacity"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const newOpts = (comp.data.options as Array<unknown>).filter((_: unknown, i: number) => i !== optIdx);
                                                updateComponent(comp.id, { options: newOpts });
                                              }}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}

                                        {/* Add Option Button */}
                                        <button
                                          className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-1 pl-6"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const currentOpts = (comp.data.options as Array<Record<string, unknown>>) || [];
                                            // Generate short unique suffix
                                            const newId = `opt_${Date.now().toString().slice(-4)}`;
                                            const newOpt = {
                                              id: newId,
                                              title: `Option ${currentOpts.length + 1}`
                                            };
                                            updateComponent(comp.id, {
                                              options: [...currentOpts, newOpt]
                                            });
                                          }}
                                        >
                                          <Plus className="w-3 h-3" /> Add Option
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                {comp.type === "Footer" && (
                                  <div className="mt-4 pt-2">
                                    {inlineEditId === comp.id ? (
                                      <input
                                        type="text"
                                        autoFocus
                                        className="w-full h-10 text-sm font-semibold text-center text-white bg-[#007bff] rounded-full shadow-sm outline-none border-2 border-white"
                                        value={inlineEditValue}
                                        onChange={(e) => setInlineEditValue(e.target.value)}
                                        onBlur={() => {
                                          updateComponent(comp.id, { label: inlineEditValue });
                                          setInlineEditId(null);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            updateComponent(comp.id, { label: inlineEditValue });
                                            setInlineEditId(null);
                                          }
                                          if (e.key === "Escape") {
                                            setInlineEditId(null);
                                          }
                                        }}
                                      />
                                    ) : (
                                      <button
                                        className="w-full h-10 text-sm font-semibold text-white bg-[#007bff] rounded-full shadow-sm hover:bg-[#0056b3] transition-colors"
                                        onDoubleClick={(e) => {
                                          e.stopPropagation();
                                           setInlineEditId(comp.id);
                                           setInlineEditValue((comp.data.label as string) || "Continue");
                                         }}
                                        title="Double-click to edit button text"
                                      >
                                        {String(comp.data.label)}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. RIGHT SIDEBAR: PROPERTIES */}
                  <div className="w-96 bg-card border-l border-border flex flex-col shrink-0 overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/20">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        {selectedComponentId ? "Component Properties" : "Components Library"}
                      </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                      {/* COMPONENT PALETTE */}

                      {!selectedComponentId ? (
                        <div className="space-y-6">
                          {/* Screen Settings Moved to Properties Tab */}

                          <div>
                            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">
                              Layout Elements
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-8"
                                onClick={() => addComponent("TextHeading")}
                              >
                                Heading
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-8"
                                onClick={() => addComponent("TextBody")}
                              >
                                Body Text
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-8"
                                onClick={() => addComponent("Footer")}
                              >
                                Footer Button
                              </Button>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">
                              Form Inputs
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-8"
                                onClick={() => addComponent("TextInput")}
                              >
                                Text Input
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-8"
                                onClick={() => addComponent("Dropdown")}
                              >
                                Dropdown
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-8"
                                onClick={() => addComponent("RadioButtons")}
                              >
                                Radio Group
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-8"
                                onClick={() => addComponent("CheckboxGroup")}
                              >
                                Checkbox
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="justify-start text-xs h-8"
                                onClick={() => addComponent("DatePicker")}
                              >
                                Date Picker
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="-ml-2 text-xs text-muted-foreground"
                              onClick={() => setSelectedComponentId(null)}
                            >
                              <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">
                              {selectedComponentContext?.type}
                            </span>
                          </div>

                          <div className="space-y-4">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 border-b pb-1">
                              {selectedComponentContext?.type} Properties
                            </div>

                            {(selectedComponentContext?.type === "TextHeading" ||
                              selectedComponentContext?.type === "TextBody") && (
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                    Text Content
                                  </label>
                                   <textarea
                                     className={`w-full text-xs bg-background border px-2 py-1.5 rounded min-h-20 ${inlineEditId === "props_text" ? "border-primary ring-1 ring-primary/20" : ""}`}
                                     value={inlineEditId === "props_text" ? inlineEditValue : ((selectedComponentContext?.data.text as string) || "")}
                                    onFocus={() => {
                                      setInlineEditId("props_text");
                                      setInlineEditValue((selectedComponentContext?.data.text as string) || "");
                                    }}
                                    onChange={(e) => setInlineEditValue(e.target.value)}
                                    onBlur={() => {
                                      if (selectedComponentId) {
                                        updateComponent(selectedComponentId, { text: inlineEditValue });
                                      }
                                      setInlineEditId(null);
                                    }}
                                  />
                                </div>
                              )}

                            {[
                              "TextInput",
                              "Dropdown",
                              "RadioButtons",
                              "CheckboxGroup",
                              "DatePicker",
                              "Footer",
                            ].includes(selectedComponentContext?.type || "") && (
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                      Label / Button Text
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full text-xs bg-background border px-2 py-1.5 rounded"
                                      value={String(selectedComponentContext?.data.label || "")}
                                      onChange={(e) => selectedComponentId && updateComponent(selectedComponentId, { label: e.target.value })}
                                    />
                                  </div>

                                  {selectedComponentContext?.type !== "Footer" && (
                                    <>
                                      <div>
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                          Field Name (ID)
                                        </label>
                                        <input
                                          type="text"
                                          className="w-full text-xs bg-background border px-2 py-1.5 rounded font-mono"
                                          value={String(selectedComponentContext?.data.name || "")}
                                          onChange={(e) => selectedComponentId && updateComponent(selectedComponentId, { name: e.target.value })}
                                          placeholder="e.g. first_name"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id="req-check"
                                          checked={Boolean(selectedComponentContext?.data.required) || false}
                                          onChange={(e) => selectedComponentId && updateComponent(selectedComponentId, { required: e.target.checked })}
                                        />
                                        <label htmlFor="req-check" className="text-xs">
                                          Required Field
                                        </label>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                            {(selectedComponentContext?.type === "Dropdown" ||
                              selectedComponentContext?.type === "RadioButtons" ||
                              selectedComponentContext?.type === "CheckboxGroup") && (
                                <div>
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                      Options List
                                    </label>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-5 text-[10px] px-2"
                                      onClick={() => {
                                        const currentOpts = selectedComponentContext.data.options;
                                        const newOpt = { id: `opt_${Date.now()}`, title: "New Option" };
                                        updateComponent(selectedComponentContext.id, { options: [...(Array.isArray(currentOpts) ? currentOpts : []), newOpt] });
                                      }}
                                    >
                                      <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                  </div>
                                  <div className="space-y-2 max-h-75 overflow-y-auto pr-1">
                                    {typeof selectedComponentContext?.data.options === "string" ? (
                                      <div className="p-3 bg-blue-50 text-blue-700 text-[10px] rounded-lg border border-blue-100 space-y-2">
                                        <div className="font-bold flex items-center gap-1.5">
                                          <Workflow className="w-3 h-3" />
                                          Dynamic Data Source
                                        </div>
                                        <p>Options are loaded dynamically from:</p>
                                        <div className="flex gap-2">
                                          <input 
                                            className="flex-1 bg-white border rounded px-2 py-1 font-mono text-zinc-900"
                                            value={selectedComponentContext.data.options}
                                            onChange={(e) => updateComponent(selectedComponentContext.id, { options: e.target.value })}
                                          />
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 text-[9px] bg-white"
                                            onClick={() => updateComponent(selectedComponentContext.id, { options: [] })}
                                          >
                                            Static
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        {(selectedComponentContext?.data.options as Array<{ id: string; title: string; label?: string }> || []).map((opt, idx: number) => (
                                          <div key={idx} className="flex flex-col gap-1 p-2 bg-muted/30 rounded-lg group">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[9px] font-bold text-muted-foreground uppercase">Option {idx + 1}</span>
                                              <button
                                                onClick={() => {
                                                  const newOpts = (selectedComponentContext.data.options as Array<unknown>).filter((_, i) => i !== idx);
                                                  updateComponent(selectedComponentContext.id, { options: newOpts });
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                              <div>
                                                <label className="text-[8px] text-muted-foreground uppercase mb-0.5 block">Label</label>
                                                <input
                                                  className="w-full text-xs bg-background border px-2 py-1 rounded"
                                                  value={opt.title}
                                                  onChange={(e) => {
                                                    const currentOptions = selectedComponentContext.data.options;
                                                    const newOpts = [...(Array.isArray(currentOptions) ? currentOptions : [])];
                                                    newOpts[idx] = { ...newOpts[idx], title: e.target.value };
                                                    updateComponent(selectedComponentContext.id, { options: newOpts });
                                                  }}
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[8px] text-muted-foreground uppercase mb-0.5 block">ID</label>
                                                <input
                                                  className="w-full text-xs bg-muted/50 border px-2 py-1 rounded font-mono"
                                                  value={opt.id}
                                                  onChange={(e) => {
                                                    const currentOpts = selectedComponentContext.data.options;
                                                    const newOpts = [...(Array.isArray(currentOpts) ? currentOpts : [])];
                                                    newOpts[idx] = { ...newOpts[idx], id: e.target.value };
                                                    updateComponent(selectedComponentContext.id, { options: newOpts });
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                        <div className="flex gap-2">
                                          <Button
                                            variant="ghost"
                                            className="w-full text-[10px] h-8 border-2 border-dashed"
                                            onClick={() => {
                                              const currentOpts = selectedComponentContext.data.options || [];
                                              const newOpt = { id: `opt_${Date.now()}`, title: "New Option" };
                                              updateComponent(selectedComponentContext.id, { options: [...(Array.isArray(currentOpts) ? currentOpts : []), newOpt] });
                                            }}
                                          >
                                            + Add Static Option
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            className="w-full text-[10px] h-8 border-2 border-dashed text-primary"
                                            onClick={() => updateComponent(selectedComponentContext.id, { options: "${data.items}" })}
                                          >
                                            ⚡ Use Dynamic Data
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  {(!selectedComponentContext?.data.options || (Array.isArray(selectedComponentContext?.data.options) && selectedComponentContext.data.options.length === 0)) && (
                                      <div className="text-center py-4 border-2 border-dashed rounded text-[10px] text-muted-foreground">
                                        No options added.
                                      </div>
                                    )}
                                </div>
                              )}

                            <div>
                              <div className="mb-2">
                                {(() => {
                                  const isTerminal = activeScreenContext?.terminal;
                                  let enforcedType = "";
                                  let isLocked = false;
                                  let lockReason = "";

                                  if (isTerminal) {
                                    enforcedType = "complete";
                                    isLocked = true;
                                    lockReason = "Terminal screens must complete the flow";
                                  } else {
                                    enforcedType = "data_exchange";
                                    isLocked = true;
                                    lockReason = "All actions must submit to server";
                                  }

                                  return (
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                          Action Type
                                        </label>
                                        {isLocked && (
                                          <span className="text-[9px] text-amber-600 font-medium">
                                            🔒 {lockReason}
                                          </span>
                                        )}
                                      </div>
                                      <select
                                        className={`w-full text-xs bg-background border px-2 py-1.5 rounded ${isLocked ? "opacity-70 bg-muted cursor-not-allowed" : ""}`}
                                        value={isLocked ? String(enforcedType) : String(selectedComponentContext?.data.actionType || "navigate")}
                                        onChange={(e) => selectedComponentId && updateComponent(selectedComponentId, { actionType: e.target.value })}
                                        disabled={isLocked}
                                      >
                                        <option value="navigate">Navigate to Screen</option>
                                        <option value="data_exchange">Submit Data (Server)</option>
                                        <option value="complete">Complete Flow</option>
                                      </select>
                                    </div>
                                  );
                                })()}
                              </div>

                              {(selectedComponentContext?.data.actionType === "navigate" || selectedComponentContext?.data.actionType === "data_exchange") && (
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-muted-foreground">
                                    Target Screen
                                  </label>
                                  <select
                                    className="w-full text-xs bg-background border px-2 py-1.5 rounded"
                                    value={String(selectedComponentContext?.data.nextScreenId || "")}
                                    onChange={(e) => selectedComponentId && updateComponent(selectedComponentId, { nextScreenId: e.target.value })}
                                  >
                                    <option value="" disabled>Select Screen...</option>
                                    {screens.filter((s) => s.id !== activeScreenId).map((s) => (
                                      <option key={s.id} value={s.id}>{s.title} ({s.id})</option>
                                    ))}
                                  </select>
                                  {selectedComponentContext?.data.actionType === "navigate" && !selectedComponentContext?.data.nextScreenId && (
                                    <p className="text-[10px] text-red-500 mt-1 font-semibold">
                                      ⚠️ Please select a target screen to avoid validation errors.
                                    </p>
                                  )}
                                  {selectedComponentContext?.data.actionType === "data_exchange" && (
                                    <p className="text-[10px] text-orange-600 mt-1">
                                      Server <b>MUST</b> return this screen ID after processing.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}



                    </div>
                  </div>
                </div>


            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/20">
              <Button variant="outline" onClick={onClose}>
                {flow?.status === "PUBLISHED" || flow?.status === "DEPRECATED" ? "Close" : "Cancel"}
              </Button>
              {!(flow?.status === "PUBLISHED" || flow?.status === "DEPRECATED") && (
                <Button
                  onClick={() => {
                    // Always use builder to generate JSON
                    const jsonToUse = generateJSONFromScreens();
                    handleSave(jsonToUse);
                  }}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {flow ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    flow ? "Update Form" : "Create Form"
                  )}
                </Button>
              )}
            </div>
          </motion.div >
        </div >
      )
      }
    </AnimatePresence >
  );
}
