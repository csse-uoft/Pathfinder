import React, { useRef, useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import { Container, Button, TextField, Drawer, IconButton, Tabs, Tab, Box, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { makeStyles } from "@mui/styles";
import Dropdown from "../shared/fields/MultiSelectField";
import { fetchNodeGraphData, fetchNodeGraphDataByOrganization } from "../../api/nodeGraphApi";
import { fetchOrganizations } from "../../api/organizationApi";
import { Loading } from "../shared";
import { reportErrorToBackend } from "../../api/errorReportApi";

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
    position: 'relative',
    top: '40px',
    left: '10px',
    zIndex: 1000,
  },
}));

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
  const [state, setState] = useState({
    loading: true
  });
  const [errors, setErrors] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);

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
  }

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
  }



  // useEffect(() => {
  //   fetchNodeGraphData().then(({elements}) => {
  //     const {nodes, edges} = elements
  //     nodes.map(node => node['data']['color'] = nodeType2Color[node.data.type] || '#df1087')
  //     edges.map(edge => edge.data.color = edgeType2Color[edge.data.label] || '#df1087')
  //     setElements({nodes, edges})
  //   })
  // }, [])


  useEffect(() => {
    if (selectedOrganizations.length > 0) {
      console.log("Fetching data for selected organizations:", selectedOrganizations);
      fetchNodeGraphDataByOrganization(selectedOrganizations).then(({ elements }) => {
        const { nodes, edges } = elements;
        nodes.forEach(node => node['data']['color'] = nodeType2Color[node.data.type] || '#df1087');
        edges.forEach(edge => edge.data.color = edgeType2Color[edge.data.label] || '#df1087');
        setElements({ nodes, edges });
      }).catch(e => {
        reportErrorToBackend(e);
      });
    } else {
      setElements({ nodes: [], edges: [] });
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

  const handleColorChange = (event) => {
    setNodeColor(event.target.value);
  };

  const updateNodeColor = () => {
    if (selectedNode) {
      const node = cyRef.current.getElementById(selectedNode.id);
      node.style('background-color', nodeColor);
    }
  };

  const handleClose = () => {
    setDrawerOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDataChange = (event) => {
    setSelectedData(event.target.value);
  };

  const renderSelectedData = () => {
    if (selectedData === 'all') {
      cyRef.current.nodes().style('display', 'element');
      cyRef.current.edges().style('display', 'element');
    } else {
      cyRef.current.nodes().style('display', 'none');
      cyRef.current.edges().style('display', 'none');
      cyRef.current.getElementById(selectedData).style('display', 'element');
      cyRef.current.edges(`[source = "${selectedData}"], [target = "${selectedData}"]`).style('display', 'element');
      cyRef.current.nodes(`[id = "${selectedData}"]`).neighborhood().nodes().style('display', 'element');
    }
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
          label={'Organizations'}
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
        Select Data to Render
      </Button>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Select Data</DialogTitle>
        <DialogContent>
          <FormControl className={classes.formControl}>
            <InputLabel id="data-select-label">Node</InputLabel>
            <Select
              labelId="data-select-label"
              value={selectedData}
              onChange={handleDataChange}
            >
              <MenuItem value="all">All</MenuItem>
              {elements?.nodes?.map(node => (
                <MenuItem key={node.id} value={node.id}>{node.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { renderSelectedData(); handleDialogClose(); }} color="primary">
            OK
          </Button>
        </DialogActions>
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
                  <Button variant="contained" color="primary" onClick={updateNodeColor} className={classes.button}>
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
