import React, { useRef, useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import { Container, Button, TextField, Drawer, IconButton, Tabs, Tab, Box, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { makeStyles } from "@mui/styles";
import Dropdown from "../shared/fields/MultiSelectField";
import { fetchNodeGraphDataByOrganization } from "../../api/nodeGraphApi";
import { fetchOrganizations } from "../../api/organizationApi";
import { reportErrorToBackend } from "../../api/errorReportApi";

// Custom styles
const useStyles = makeStyles(() => ({
  root: {
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    display: 'flex',
  },
  cyContainer: {
    width: '100%',
    height: '100%',
  },
  drawer: {
    width: 400,
    padding: '10px',
  },
  closeButton: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    marginTop: 12,
    marginBottom: 0,
    length: 100,
  },
  tabPanel: {
    padding: '10px',
  },
  formControl: {
    marginTop: 16,
    minWidth: 120,
  },
  dropdownContainer: {
    position: 'fixed',
    top: '40px',
    left: '10px',
    zIndex: 1000,
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
  },
  colorPicker: {
    minWidth: 60,
    marginTop: 24,
  }
}));

// NodeTypeSelector Component
function NodeTypeSelector({ nodeTypes, selectedNodeType, handleNodeTypeChange }) {
  return (
    <FormControl fullWidth margin="normal">
      <InputLabel id="type-select-label">Node Type</InputLabel>
      <Select
        labelId="type-select-label"
        value={selectedNodeType}
        onChange={handleNodeTypeChange}
      >
        {nodeTypes.map(type => (
          <MenuItem key={type} value={type}>{type}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// NodeColorPicker Component
function NodeColorPicker({ selectedTypeColor, handleColorChange }) {
  return (
    <TextField
      label="Color"
      type="color"
      value={selectedTypeColor}
      onChange={handleColorChange}
      fullWidth
      margin="normal"
    />
  );
}

// DialogActionsModule Component
function DialogActionsModule({ handleUpdateColor }) {
  return (
    <DialogActions>
      <Button variant="contained" color="primary" onClick={handleUpdateColor}>
        Update 
      </Button>
    </DialogActions>
  );
}

// TabPanel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

// Empty Module 1: NodeShapeSelector
function NodeShapeSelector() {
  return (
    <TextField
      label="Shape"
    />
  );
}

// Empty Module 2: NodeSizeSelector
function NodeSizeSelector() {
  return (
    <TextField
      label="Size"
    />
  );
}

// Empty Module 3: NodeLabelEditor
function NodeLabelEditor() {
  return (
    <TextField
      label="Label"
    />
  );
}

// Empty Module 4: EdgeStyleEditor
function EdgeStyleEditor() {
  return (
    <TextField
    label="Edge"
  />
  );
}

// Empty Module 5: LayoutSelector
function LayoutSelector() {
  return (
    <TextField
    label="Layout"
  />
  );
}

// Empty Module 6: DataImportExport
function DataImportExport() {
  return (
    <TextField
    label="Import"
  />
  );
}

// Main NodeGraph Component
export default function NodeGraph() {
  const classes = useStyles();
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeColor, setNodeColor] = useState('#666');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedData, setSelectedData] = useState('basic');
  const [elements, setElements] = useState(null);
  const [organizationInterfaces, setOrganizationInterfaces] = useState({});
  const [state, setState] = useState({ loading: true });
  const [errors, setErrors] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [nodeColors, setNodeColors] = useState({});
  const [nodeTypes, setNodeTypes] = useState([]); // New state for node types
  const [selectedNodeType, setSelectedNodeType] = useState(''); // New state for selected node type
  const [selectedTypeColor, setSelectedTypeColor] = useState('#666'); // New state for selected type color

  const nodeType2Color = {
    "cids:Organization": "#9eeb17",
    "cids:Indicator": "#eb7b17",
    "cids:Outcome": "#eb3a17",
    "time:DateTimeInterval": "#f0fa0b",
    "iso21972:Measure": "#06f920",
    "cids:Code": "#06f999",
    "cids:StakeholderOutcome": "#06f999",
    "cids:IndicatorReport": "#069df9",
    "cids:HowMuchImpact": "#1a3ef0",
    "dcat:Dataset": "#8d54e3",
    "cids:ImpactRisk": "#8910f5",
    "cids:Characteristic": "#c532e8",
    "cids:Theme": "#f938e2",
    "cids:ImpactReport": "#2e0e26",
    "cids:Counterfactual": "#ebcc1e",
    "cids:ImpactNorms": "#e0a19b"
  };

  const edgeType2Color = {
    "cids:hasIndicator": "#413f1a",
    "cids:hasOutcome": "#e74c1f",
    "cids:hasIndicatorReport": "#dea522",
    "cids:definedBy": "#f3f018",
    "cids:forOrganization": "#c5f318",
    "cids:forIndicator": '#99f318',
    "cids:hasImpactModel": "#18f3a3",
    "cids:forOutcome": "#2d8e6b",
    "cids:hasCode": "#1bf7d3",
    "cids:forTheme": "#1bccf7",
    "iso21972:value": "#246fb2",
    "dcat:dataset": "#a497f6",
    "cids:hasImpactReport": "#c197f6",
    "cids:hasStakeholderOutcome": "#480997"
  };

  useEffect(() => {
    if (selectedOrganizations.length > 0) {
      fetchNodeGraphDataByOrganization(selectedOrganizations).then(({ elements }) => {
        const { nodes, edges } = elements;
        const types = [...new Set(nodes.map(node => node.data.type))];
        setNodeTypes(types);

        nodes.forEach(node => {
          const manualColor = nodeColors[node.data.id];
          node['data']['color'] = manualColor || nodeType2Color[node.data.type] || '#df1087';
        });
        edges.forEach(edge => {
          edge.data.color = edgeType2Color[edge.data.label] || '#df1087';
        });
        setElements({ nodes, edges });
      }).catch(e => {
        reportErrorToBackend(e);
      });
    } else {
      setElements({ nodes: [], edges: [] });
    }
  }, [selectedOrganizations, nodeColors]);

  useEffect(() => {
    fetchOrganizations().then(res => {
      if (res.success) {
        const orgInterfaces = {};
        res.organizations.forEach(organization => {
          orgInterfaces[organization._uri] = organization.legalName;
        });
        setOrganizationInterfaces(orgInterfaces);
        setState(state => ({ ...state, loading: false }));
      }
    }).catch(e => {
      reportErrorToBackend(e);
      setState(state => ({ ...state, loading: false }));
    });
  }, []);

  useEffect(() => {
    if (elements) {
      cyRef.current = cytoscape({
        container: document.getElementById('cy'),
        elements: elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              'label': 'data(label)',
              'width': '60px',
              'height': '60px',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '5px',
              'text-wrap': 'wrap',
              'text-max-width': "50px",
              'transition-property': 'background-color, border-width, border-color',
              'transition-duration': '0.5s',
              'word-break': 'break-all',
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 3,
              'line-color': 'data(color)',
              'target-arrow-color': 'data(color)',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '5px',
              'text-rotation': 'autorotate',
              'text-margin-y': -7,
            }
          }
        ],
        layout: {
          name: 'cose'
        }
      });

      Object.keys(nodeColors).forEach(nodeId => {
        cyRef.current.$(`#${nodeId}`).style('background-color', nodeColors[nodeId]);
      });

      cyRef.current.on('tap', 'node', (evt) => {
        const node = evt.target;
        setSelectedNode(node.data());
        setNodeColor(node.style('background-color'));
        setDrawerOpen(true);
      });

      return () => {
        cyRef.current.destroy();
      };
    }
  }, [elements]);

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleNodeTypeChange = (event) => {
    setSelectedNodeType(event.target.value);
  };

  const handleColorChange = (event) => {
    setSelectedTypeColor(event.target.value);
  };

  const handleUpdateColor = () => {
    if (selectedNodeType) {
      const sameTypeNodes = cyRef.current.nodes(`[type = "${selectedNodeType}"]`);
      sameTypeNodes.forEach(node => {
        node.style('background-color', selectedTypeColor);
        setNodeColors(prev => ({
          ...prev,
          [node.id()]: selectedTypeColor
        }));
      });
    }
    handleDialogClose();
  };

  const handleClose = () => {
    setDrawerOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };


  const getRelationships = () => {
    if (!selectedNode) return null;
    const edges = cyRef.current.edges(`[source = "${selectedNode.id}"], [target = "${selectedNode.id}"]`);
    return edges.map(edge => (
      <p key={edge.id()}>Edge ID: {edge.id()} (Source: {edge.data('source')}, Target: {edge.data('target')})</p>
    ));
  };

  const getNeighborhood = () => {
    if (!selectedNode) return null;
    const neighborhood = cyRef.current.$(`#${selectedNode.id}`).neighborhood().nodes();
    return neighborhood.map(node => (
      <p key={node.id()}>Node ID: {node.id()}, Label: {node.data('label')}</p>
    ));
  };

  return (
    <div className={classes.root}>
      <div id="cy" className={classes.cyContainer}></div>

      <div className={classes.dropdownContainer}>
        <Dropdown
          chooseAll
          key={'organizations'}
          label={'Data Filter'}
          value={selectedOrganizations}
          options={organizationInterfaces}
          error={!!errors.organizations}
          helperText={errors.organizations}
          onChange={e => {
            setSelectedOrganizations(e.target.value);
          }}
        />
      </div>
      <Button variant="contained" color="primary" onClick={handleDialogOpen}>
        Modify Node Style
      </Button>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Select Node Type</DialogTitle>
        <DialogContent>
          <NodeTypeSelector
            nodeTypes={nodeTypes}
            selectedNodeType={selectedNodeType}
            handleNodeTypeChange={handleNodeTypeChange}
          />
          <NodeColorPicker
            selectedTypeColor={selectedTypeColor}
            handleColorChange={handleColorChange}
          />

              {/* Future Expansion: Empty modules added for potential future functionalities */}
              <NodeShapeSelector />
              <NodeSizeSelector />
              <NodeLabelEditor />
              <EdgeStyleEditor />
              <LayoutSelector />
              <DataImportExport />
        </DialogContent>
        <DialogActionsModule handleUpdateColor={handleUpdateColor} />
      </Dialog>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleClose}
        className={classes.drawer}
      >
        <div className={classes.drawer}>
          <div className={classes.closeButton}>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </div>
          {selectedNode ? (
            <div>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="node information tabs">
                <Tab label="Basic Information" />
                <Tab label="Relationship" />
                <Tab label="Neighborhood" />
              </Tabs>
              <TabPanel value={tabValue} index={0}>
                <>
                  <p>URI: {selectedNode.id}</p>
                  <p>Type: {selectedNode.type}</p>
                  <p>Name: {selectedNode.label}</p>
                  <TextField
                    label="Node Color"
                    type="color"
                    value={nodeColor}
                    onChange={handleColorChange}
                    fullWidth
                    margin="normal"
                  />
                  <Button variant="contained" color="primary" onClick={handleUpdateColor} className={classes.button}>
                    Update Color
                  </Button>
                </>
                {selectedData === 'relationship' && getRelationships()}
                {selectedData === 'neighborhood' && getNeighborhood()}
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                {getRelationships()}
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                {getNeighborhood()}
              </TabPanel>
            </div>
          ) : (
            <p>Click on a node to see its information</p>
          )}
        </div>
      </Drawer>

    </div>
  );
}
