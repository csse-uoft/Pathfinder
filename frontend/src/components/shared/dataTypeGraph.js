import React, {useEffect, useState, useContext, useRef} from "react";
import {useSnackbar} from "notistack";
import cytoscape from "cytoscape";
import svg from "cytoscape-svg";
import RadioField from "./fields/RadioField";
import {fetchNodeGraphData, fetchNodeGraphDataByOrganization} from "../../api/nodeGraphApi";
import {reportErrorToBackend} from "../../api/errorReportApi";
import Dropdown from "./fields/MultiSelectField";
import {Button, Dialog, DialogContent, Drawer, IconButton, Tab, Tabs, TextField} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {makeStyles} from "@mui/styles";


// Custom styles
const useStyles = makeStyles(() => ({
  root: {
    width: '25vw',
    height: '50vh',
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
    // position: 'fixed',
    // top: '40px',
    // left: '10px',
    zIndex: 1000,
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '5px',
    // boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
  },
  colorPicker: {
    minWidth: 60,
    marginTop: 24,
  }
}));


export default function DataTypeGraph({Theme, Indicator}) {
  const classes = useStyles();
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedData, setSelectedData] = useState('basic');
  const [elements, setElements] = useState(null);
  const [organizationInterfaces, setOrganizationInterfaces] = useState({});
  const [state, setState] = useState({loading: true});
  const [errors, setErrors] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [nodeTypes, setNodeTypes] = useState([]); // New state for node types
  const [edgeTypes, setEdgeTypes] = useState([]);
  const [nodesDict, setNodesDict] = useState({});
  const [selectedNodeType, setSelectedNodeType] = useState(''); // New state for selected node type
  const [selectedEdgeType, setSelectedEdgeType] = useState(''); // New state for selected node type
  const [selectedNodeTypeColor, setSelectedNodeTypeColor] = useState('#666'); // New state for selected type color
  const [selectedEdgeTypeColor, setSelectedEdgeTypeColor] = useState('#666'); // New state for selected type color
  const [themeAnchor, setThemeAnchor] = useState('organizationAnchor');
  const [visibleDataTypes, setVisibleDataTypes] = useState([]);
  const [visibleEdgeTypes, setVisibleEdgeTypes] = useState([])
  const {enqueueSnackbar} = useSnackbar();
  const [edgeCache, setEdgeCache] = useState({})
  const [hideOrRemove, setHideOrRemove] = useState('Hide')
  const [edgeStatus, setEdgeStatus] = useState({})

  cytoscape.use(svg);

  // function getRoots() {
  //   const roots = []
  //   cyRef.current.nodes(`[type = "${themeAnchor === 'themeAnchor'? 'cids:Theme' : 'cids:Organization'}"]`).forEach(node => {
  //     roots.push(node.id())
  //   })
  //   return roots
  // }

  // function handleEdgeModeChange(edgeLabel) {
  //   return (e) => {
  //
  //     const recoverCachedEdges = (type) => {
  //       if (edgeCache?.[type]?.length) {
  //         const recoverEdges = edgeCache[type]
  {/*        cyRef.current.add(recoverEdges);*/}
  //         edgeCache[type] = []
  //         setEdgeCache(edgeCache)
  //         return 1
  //       }
  //       return 0
  //     }
  //
  //     const action = e.target.value
  //     const edgeStat = edgeStatus
  //     edgeStat[edgeLabel] = action
  {/*    setEdgeStatus(edgeStat)*/}
  //     let reRender
  //
  //     if (action === 'Hide') {
  //       reRender = recoverCachedEdges(edgeLabel)
  //       cyRef.current.edges(`[label = "${edgeLabel}"]`).forEach(edge => {
  //         edge.style({
  {/*          display: 'none'*/}
  {/*        });*/}
  {/*      });*/}
  //     } else if (action === 'Remove') {
  //       reRender = 1
  //       edgeCache[edgeLabel] = cyRef.current.edges(`[label = "${edgeLabel}"]`).map(edge => {
  //         const cacheItem = {
  //           group: 'edges', // this specifies it's an edge
  //           data: {
  //             source: edge.data('source'),
  //             target: edge.data('target'),
  //             label: edge.data('label'),
  //             color: edge.data('color')
  //           }
  //         };
  //         edge.remove()
  //         return cacheItem
  //       });
  //       setEdgeCache(edgeCache)
  //     } else if (action === 'Visible') {
  //       reRender = recoverCachedEdges(edgeLabel)
  //       cyRef.current.edges(`[label = "${edgeLabel}"]`).forEach(edge => {
  //         edge.style({
  //           display: 'element'
  //         });
  //       });
  //     }
  //
  //     if (reRender) {
  //       const layout = cyRef.current.layout({
  //         name: 'breadthfirst',
  //         roots: getRoots()
  //       });
  //
  //       layout.run();
  //     }
  //
  //   }
  // }

  // function EdgeMode({edgeLabel}) {
  //   return (
  //     // <div>
  //     /*<h4> {edgeLabel} </h4>*/
  //     <RadioField
  //       label={edgeLabel}
  //       value={edgeStatus[edgeLabel]}
  //       onChange={handleEdgeModeChange(edgeLabel)}
  //       options={{'Visible':'Visible', 'Hide': 'Hide', 'Remove': 'Remove'}}
  //       row
  //       key={`edgeStatus: ${edgeLabel}`}
  //     />
  //     // </div>
  //
  //   )
  // }

  function rgbToHex(rgb) {
    // Extract the numbers from the rgb string
    const rgbValues = rgb.match(/\d+/g).map(Number);

    // Convert each number to a two-digit hexadecimal and join them together
    return `#${rgbValues.map(value => value.toString(16).padStart(2, '0')).join('')}`;
  }


  // useEffect(() => {
  //
  //   if (cyRef.current?.layout) {
  //     const layout = cyRef?.current?.layout({
  //       name: 'breadthfirst',
  //       roots: getRoots()
  //     });
  //     layout.run();
  //   }
  //
  // }, [themeAnchor])

  useEffect(() => {

      fetchNodeGraphData(Theme? 'theme':"indicator").then(({elements}) => {
        const {nodes, edges} = elements;
        // const nodesDict = {}
        // const nodeTypes = [...new Set(nodes.map(node => node.data.type))];
        // const edgeTypes = [...new Set(edges.map(edge => edge.data.label))]
        // setNodeTypes(nodeTypes);
        // setVisibleDataTypes(Object.keys(nodeTypes));
        // setEdgeTypes(edgeTypes);
        // setVisibleEdgeTypes(Object.keys(edgeTypes))
        // const edgeStat = {}
        // edgeTypes.map(edgeType => edgeStat[edgeType] = 'Visible')
        // setEdgeStatus(edgeStat)

        nodes.forEach(node => {
          // nodesDict[node.data.id] = node.data
          node['data']['color'] = '#df1087';
        });
        edges.forEach(edge => {
          edge.data.color = "#1bccf7";
        });
        // setNodesDict(nodesDict)
        setElements({nodes, edges});
      }).catch(e => {
        reportErrorToBackend(e);
        console.log(e)
        enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
      });

  }, []);

  // useEffect(() => {
  //   fetchOrganizations().then(res => {
  //     if (res.success) {
  //       const orgInterfaces = {};
  //       res.organizations.forEach(organization => {
  //         orgInterfaces[organization._uri] = organization.legalName;
  //       });
  //       setOrganizationInterfaces(orgInterfaces);
  //       setState(state => ({...state, loading: false}));
  //     }
  //   }).catch(e => {
  //     reportErrorToBackend(e);
  //     enqueueSnackbar(e.json?.message || "Error occur", {variant: 'error'});
  //     setState(state => ({...state, loading: false}));
  //   });
  // }, []);

  useEffect(() => {
    if (elements) {
      let roots = []
      // if (themeAnchor === 'themeAnchor') {
      //   elements.nodes.map(node => {
      //     if (node.data.type === 'cids:Theme') {
      //       roots.push(node['data'].id)
      //     }
      //   })
      // } else {
      //   elements.nodes.map(node => {
      //     if (node.data.type === 'cids:Organization') {
      //       roots.push(node['data'].id)
      //     }
      //   })
      // }
      cyRef.current = cytoscape({
        container: document.getElementById('cy'),
        elements: elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              'label': 'data(label)',
              'width': '8px',
              'height': '8px',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '2px',
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
              'width': 1,
              'line-color': 'data(color)',
              'target-arrow-color': 'data(color)',
              'target-arrow-shape': 'triangle',
              'arrow-scale': '0.5',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '2px',
              'text-rotation': 'autorotate',
              'text-margin-y': -5,
              'word-break': 'break-all',
              'text-wrap': 'wrap',
            }
          }
        ],
        layout: {
          name: 'cose',
          idealEdgeLength: 3, // shorter edges
          nodeRepulsion: 4000,
          gravity: 0.25,
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
    const nodeType = event.target.value;
    setSelectedNodeType(nodeType);
    const node = cyRef.current.nodes(`[type = "${nodeType}"]`).eq(0);
    setSelectedNodeTypeColor(rgbToHex(node.style('background-color')));
  };
  const handleEdgeTypeChange = (event) => {
    const edgeType = event.target.value;
    setSelectedEdgeType(edgeType);
    const edge = cyRef.current.edges(`[label = "${edgeType}"]`).eq(0);
    setSelectedEdgeTypeColor(rgbToHex(edge.style('line-color')));
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
      setSelectedNodeType('');
      setSelectedNodeTypeColor('#666');
    }
    if (selectedEdgeType) {
      cyRef.current.batch(() => {
        const sameTypeEdges = cyRef.current.edges(`[label = "${selectedEdgeType}"]`);
        sameTypeEdges.forEach(edge => {
          edge.data('color', selectedEdgeTypeColor);
        });
      });
      setSelectedEdgeType('');
      setSelectedNodeTypeColor('#666');
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

      {/*<div className={classes.dropdownContainer}>*/}
        {/*<Dropdown*/}
        {/*  chooseAll*/}
        {/*  key={'organizations'}*/}
        {/*  label={'Data Filter'}*/}
        {/*  value={selectedOrganizations}*/}
        {/*  options={organizationInterfaces}*/}
        {/*  error={!!errors.organizations}*/}
        {/*  helperText={errors.organizations}*/}
        {/*  onChange={e => {*/}
        {/*    setSelectedOrganizations(e.target.value);*/}
        {/*  }}*/}
        {/*/>*/}
        {/*<div style={{ marginLeft: '20px' }}>*/}
        {/*  <Dropdown*/}
        {/*    chooseAll*/}
        {/*    key={'visibleNodeTypes'}*/}
        {/*    label={'Data Types'}*/}
        {/*    value={visibleDataTypes}*/}
        {/*    options={nodeTypes}*/}
        {/*    error={!!errors.visibleDataTypes}*/}
        {/*    helperText={errors.visibleDataTypes}*/}
        {/*    onChange={e => {*/}
        {/*      setVisibleDataTypes(e.target.value);*/}
        {/*      cyRef.current.nodes().forEach(node => {*/}
        {/*        node.style({*/}
        {/*          display: 'none'*/}
        {/*        });*/}
        {/*      });*/}
        {/*      // cyRef.current.edges(`[label = "cids:forOrganization"]`).remove()*/}
        {/*      e.target.value.map(index => {*/}
        {/*        const sameTypeNodes = cyRef.current.nodes(`[type = "${nodeTypes[index]}"]`);*/}
        {/*        sameTypeNodes.forEach(node => {*/}
        {/*          node.style({*/}
        {/*            display: 'element',*/}
        {/*            label: e.target.value.some(index => nodeTypes[index] === 'cids:Organization') ? nodesDict[node.id()].label*/}
        {/*              : `${nodesDict[node.id()].label} ${nodesDict[node.id()].organizations.join(',').toUpperCase()}`*/}
        {/*          });*/}
        {/*        });*/}
        {/*      });*/}

        {/*    }}*/}
        {/*  />*/}
        {/*</div>*/}

        {/*<RadioField value={themeAnchor}*/}
        {/*            onChange={(e) => {setThemeAnchor(e.target.value)}}*/}
        {/*            options={{'Theme Anchor': 'themeAnchor', 'Organization Anchor': 'organizationAnchor'}}*/}
        {/*            row*/}
        {/*/>*/}


      {/*</div>*/}

      {/*<Button disabled={!selectedOrganizations.length}*/}
      {/*        onClick={() => {*/}
      {/*          const svgContent = cyRef.current.svg({*/}
      {/*            scale: 1,      // Set the scale of the SVG, 1 is the default*/}
      {/*            full: true     // Export the entire graph (set to false to export the current viewport only)*/}
      {/*          });*/}
      {/*          const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });*/}

      {/*          // Create a temporary link element for the download*/}
      {/*          const link = document.createElement('a');*/}
      {/*          link.href = URL.createObjectURL(blob);*/}
      {/*          link.download = 'nodeGraph.svg'; // Specify the file name for download*/}

      {/*          // Append the link to the document and trigger the download*/}
      {/*          document.body.appendChild(link);*/}
      {/*          link.click();*/}

      {/*          // Clean up by removing the link element from the document*/}
      {/*          document.body.removeChild(link);*/}
      {/*        }}>*/}
      {/*  Download SVG*/}
      {/*</Button>*/}
      {/*<Button variant="contained" color="primary" onClick={handleDialogOpen}>*/}
      {/*  Modify Graph Appearance*/}
      {/*</Button>*/}
      {/*<Dialog open={dialogOpen} onClose={handleDialogClose}>*/}
        {/*<DialogContent style={{minWidth: '500px'}}>*/}
        {/*  <NodeTypeSelector*/}
        {/*    nodeTypes={visibleDataTypes.map(index => nodeTypes[index])}*/}
        {/*    selectedNodeType={selectedNodeType}*/}
        {/*    handleNodeTypeChange={handleNodeTypeChange}*/}
        {/*  />*/}
        {/*  <ColorPicker*/}
        {/*    selectedTypeColor={selectedNodeTypeColor}*/}
        {/*    handleColorChange={handleNodeColorChange}*/}
        {/*  />*/}
        {/*  <EdgeTypeSelector*/}
        {/*    edgeTypes={edgeTypes}*/}
        {/*    selectedEdgeType={selectedEdgeType}*/}
        {/*    handleEdgeTypeChange={handleEdgeTypeChange}*/}
        {/*  />*/}

        {/*  <ColorPicker*/}
        {/*    selectedTypeColor={selectedEdgeTypeColor}*/}
        {/*    handleColorChange={handleEdgeColorChange}*/}
        {/*  />*/}

        {/*  <div>*/}
        {/*    <h3>Edges</h3>*/}
        {/*    {edgeTypes.map(edgeType => <EdgeMode*/}
        {/*      edgeLabel={edgeType}*/}
        {/*    />)}*/}
        {/*  </div>*/}




        {/*  /!* Future Expansion: Empty modules added for potential future functionalities *!/*/}
        {/*  /!*<NodeShapeSelector />*!/*/}
        {/*  /!*<NodeSizeSelector />*!/*/}
        {/*  /!*<NodeLabelEditor />*!/*/}
        {/*  /!*<EdgeStyleEditor />*!/*/}
        {/*  /!*<LayoutSelector />*!/*/}
        {/*  /!*<DataImportExport />*!/*/}
        {/*</DialogContent>*/}
        {/*<DialogActionsModule handleUpdateColor={handleUpdateNodeColor}/>*/}
      {/*</Dialog>*/}
      {/*<Drawer*/}
      {/*  anchor="right"*/}
      {/*  open={drawerOpen}*/}
      {/*  onClose={handleClose}*/}
      {/*  className={classes.drawer}*/}
      {/*>*/}
      {/*  <div className={classes.drawer}>*/}
      {/*    <div className={classes.closeButton}>*/}
      {/*      <IconButton onClick={handleClose}>*/}
      {/*        <CloseIcon/>*/}
      {/*      </IconButton>*/}
      {/*    </div>*/}
      {/*    {selectedNode ? (*/}
      {/*      <div>*/}
      {/*        <Tabs value={tabValue} onChange={handleTabChange} aria-label="node information tabs">*/}
      {/*          <Tab label="Basic Information"/>*/}
      {/*          <Tab label="Relationship"/>*/}
      {/*          <Tab label="Neighborhood"/>*/}
      {/*        </Tabs>*/}
      {/*        <TabPanel value={tabValue} index={0}>*/}
      {/*          <>*/}
      {/*            <p>URI: {selectedNode.id}</p>*/}
      {/*            <p>Type: {selectedNode.type}</p>*/}
      {/*            <p>Name: {selectedNode.label}</p>*/}
      {/*            <TextField*/}
      {/*              label="Node Color"*/}
      {/*              type="color"*/}
      {/*              value={nodeColor}*/}
      {/*              onChange={handleColorChange}*/}
      {/*              fullWidth*/}
      {/*              margin="normal"*/}
      {/*            />*/}
      {/*            <Button variant="contained" color="primary" onClick={handleUpdateColor} className={classes.button}>*/}
      {/*              Update Color*/}
      {/*            </Button>*/}
      {/*          </>*/}
      {/*          {selectedData === 'relationship' && getRelationships()}*/}
      {/*          {selectedData === 'neighborhood' && getNeighborhood()}*/}
      {/*        </TabPanel>*/}
      {/*        <TabPanel value={tabValue} index={1}>*/}
      {/*          {getRelationships()}*/}
      {/*        </TabPanel>*/}
      {/*        <TabPanel value={tabValue} index={2}>*/}
      {/*          {getNeighborhood()}*/}
      {/*        </TabPanel>*/}
      {/*      </div>*/}
      {/*    ) : (*/}
      {/*      <p>Click on a node to see its information</p>*/}
      {/*    )}*/}
      {/*  </div>*/}
      {/*</Drawer>*/}

    </div>
  );
}