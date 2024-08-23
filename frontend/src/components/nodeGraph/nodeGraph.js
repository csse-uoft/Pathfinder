import React, { useRef, useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import { Container, Button, TextField, Drawer, IconButton, Tabs, Tab, Box, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { makeStyles } from "@mui/styles";
import Dropdown from "../shared/fields/MultiSelectField";
import { fetchNodeGraphDataByOrganization } from "../../api/nodeGraphApi";
import { fetchOrganizations } from "../../api/organizationApi";
import { reportErrorToBackend } from "../../api/errorReportApi";
import {useSnackbar} from "notistack";

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

function EdgeTypeSelector({ edgeTypes, selectedEdgeType, handleEdgeTypeChange }) {
  return (
    <FormControl fullWidth margin="normal">
      <InputLabel id="type-select-label">Edge Type</InputLabel>
      <Select
        labelId="type-select-label"
        value={selectedEdgeType}
        onChange={handleEdgeTypeChange}
      >
        {edgeTypes.map(type => (
          <MenuItem key={type} value={type}>{type}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// NodeColorPicker Component
function ColorPicker({ selectedTypeColor, handleColorChange }) {
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedData, setSelectedData] = useState('basic');
  const [elements, setElements] = useState(null);
  const [organizationInterfaces, setOrganizationInterfaces] = useState({});
  const [state, setState] = useState({ loading: true });
  const [errors, setErrors] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [nodeTypes, setNodeTypes] = useState([]); // New state for node types
  const [edgeTypes, setEdgeTypes] = useState([])
  const [selectedNodeType, setSelectedNodeType] = useState(''); // New state for selected node type
  const [selectedEdgeType, setSelectedEdgeType] = useState(''); // New state for selected node type
  const [selectedNodeTypeColor, setSelectedNodeTypeColor] = useState('#666'); // New state for selected type color
  const [selectedEdgeTypeColor, setSelectedEdgeTypeColor] = useState('#666'); // New state for selected type color
  const [visibleDataTypes, setVisibleDataTypes] = useState([])
  const {enqueueSnackbar} = useSnackbar();

  function rgbToHex(rgb) {
    // Extract the numbers from the rgb string
    const rgbValues = rgb.match(/\d+/g).map(Number);

    // Convert each number to a two-digit hexadecimal and join them together
    return `#${rgbValues.map(value => value.toString(16).padStart(2, '0')).join('')}`;
  }

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
        const nodeTypes = [...new Set(nodes.map(node => node.data.type))]
        setNodeTypes(nodeTypes);
        setVisibleDataTypes(Object.keys(nodeTypes));
        setEdgeTypes([...new Set(edges.map(edge => edge.data.label))]);
        nodes.forEach(node => {
          node['data']['color'] = nodeType2Color[node.data.type] || '#df1087';
        });
        edges.forEach(edge => {
          edge.data.color = edgeType2Color[edge.data.label] || '#df1087';
        });
        setElements({ nodes, edges });
      }).catch(e => {
        reportErrorToBackend(e);
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });
    } else {
      setElements({ nodes: [], edges: [] });
      setNodeTypes([]);
      setVisibleDataTypes([])
    }
  }, [selectedOrganizations]);

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
      enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
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
    const nodeType = event.target.value
    setSelectedNodeType(nodeType);
    const node = cyRef.current.nodes(`[type = "${nodeType}"]`).eq(0);
    setSelectedNodeTypeColor(rgbToHex(node.style('background-color')))
  };
  const handleEdgeTypeChange = (event) => {
    const edgeType = event.target.value
    setSelectedEdgeType(edgeType);
    const edge = cyRef.current.edges(`[label = "${edgeType}"]`).eq(0);
    setSelectedEdgeTypeColor(rgbToHex(edge.style('line-color')))
  };
  const handleNodeColorChange = (event) => {
    setSelectedNodeTypeColor(event.target.value);
  };

  const handleEdgeColorChange = (event) => {
    setSelectedEdgeTypeColor(event.target.value);
  };



  const handleUpdateNodeColor = () => {
    if (selectedNodeType) {
      cyRef.current.batch(() => {
        const sameTypeNodes = cyRef.current.nodes(`[type = "${selectedNodeType}"]`);
        sameTypeNodes.forEach(node => {
          node.data('color', selectedNodeTypeColor);
        });
      });
      setSelectedNodeType('')
      setSelectedNodeTypeColor('#666')
    }
    if (selectedEdgeType) {
      cyRef.current.batch(() => {
        const sameTypeEdges = cyRef.current.edges(`[label = "${selectedEdgeType}"]`);
        sameTypeEdges.forEach(edge => {
          edge.data('color', selectedEdgeTypeColor);
        });
      });
      setSelectedEdgeType('')
      setSelectedNodeTypeColor('#666')
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
        <Dropdown
          chooseAll
          key={'visibleNodeTypes'}
          label={'Data Types'}
          value={visibleDataTypes}
          options={nodeTypes}
          error={!!errors.visibleDataTypes}
          helperText={errors.visibleDataTypes}
          onChange={e => {
            setVisibleDataTypes(e.target.value);
            cyRef.current.nodes().forEach(node => {
              node.style({
                display: 'none'
              });
            })
            e.target.value.map(index => {
              const sameTypeNodes = cyRef.current.nodes(`[type = "${nodeTypes[index]}"]`);
              sameTypeNodes.forEach(node => {
                node.style({
                  display: 'element'
                });
              });
            })
          }}
        />
      </div>
      <Button variant="contained" color="primary" onClick={handleDialogOpen}>
        Modify Graph Appearance
      </Button>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogContent style={{ minWidth: '500px' }}>
          <NodeTypeSelector
            nodeTypes={visibleDataTypes.map(index => nodeTypes[index])}
            selectedNodeType={selectedNodeType}
            handleNodeTypeChange={handleNodeTypeChange}
          />
          <ColorPicker
            selectedTypeColor={selectedNodeTypeColor}
            handleColorChange={handleNodeColorChange}
          />
          <EdgeTypeSelector
          edgeTypes={edgeTypes}
          selectedEdgeType={selectedEdgeType}
          handleEdgeTypeChange={handleEdgeTypeChange}
        />

          <ColorPicker
            selectedTypeColor={selectedEdgeTypeColor}
            handleColorChange={handleEdgeColorChange}
          />

              {/* Future Expansion: Empty modules added for potential future functionalities */}
              {/*<NodeShapeSelector />*/}
              {/*<NodeSizeSelector />*/}
              {/*<NodeLabelEditor />*/}
              {/*<EdgeStyleEditor />*/}
              {/*<LayoutSelector />*/}
              {/*<DataImportExport />*/}
        </DialogContent>
        <DialogActionsModule handleUpdateColor={handleUpdateNodeColor} />
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
