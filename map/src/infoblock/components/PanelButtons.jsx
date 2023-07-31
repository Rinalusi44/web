import { ButtonGroup, IconButton, Paper, Tooltip } from '@mui/material';
import { Close, Delete, CloudUpload, Redo, Undo } from '@mui/icons-material';
import React, { useContext, useEffect, useState } from 'react';
import AppContext from '../../context/AppContext';
import SaveTrackDialog from './track/dialogs/SaveTrackDialog';
import DeleteTrackDialog from './track/dialogs/DeleteTrackDialog';
import DeleteFavoriteDialog from './favorite/DeleteFavoriteDialog';
import _ from 'lodash';
import TracksManager, { isEmptyTrack } from '../../context/TracksManager';
import useUndoRedo from '../useUndoRedo';

const PanelButtons = ({ orientation, setShowContextMenu, clearState }) => {
    const ctx = useContext(AppContext);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [useSavedState, setUseSavedState] = useState(false);

    const { state, setState, undo, redo, clear, isUndoPossible, isRedoPossible, pastStates } = useUndoRedo();

    useEffect(() => {
        if (clearState) {
            doClear();
        }
    }, [clearState]);

    useEffect(() => {
        if (useSavedState) {
            getState(state);
            ctx.setTrackState({ ...ctx.trackState });
        }
    }, [state]);

    useEffect(() => {
        if (!useSavedState) {
            if (ctx.trackState.update) {
                setState(_.cloneDeep(ctx.selectedGpxFile));
                ctx.trackState.update = false;
                ctx.setTrackState({ ...ctx.trackState });
            }
        }
    }, [ctx.trackState]);

    function doClear() {
        clear(); // setState() can't be used inside dispatch()
        ctx.setTrackState({ update: false });
    }

    function getState(currentState) {
        getTrack(currentState);
        setUseSavedState(false);
    }

    function getTrack(currentState) {
        let oldLayers = _.cloneDeep(ctx.selectedGpxFile.layers);
        let objFromState = _.cloneDeep(currentState);
        objFromState.updateLayers = true;
        objFromState.layers = oldLayers;
        objFromState.getRouting = true;

        ctx.setSelectedGpxFile({ ...objFromState });
    }

    const styleDiv = {
        marginTop: orientation === 'vertical' ? '2px' : 0,
        marginLeft: orientation === 'vertical' ? 0 : '2px',
    };

    const styleSpan = {
        marginTop: orientation === 'vertical' ? 0 : '2px',
        marginLeft: orientation === 'vertical' ? '2px' : 0,
    };

    return (
        ctx.selectedGpxFile && (
            <div style={styleDiv}>
                <Paper>
                    <ButtonGroup
                        sx={{
                            width: orientation === 'vertical' ? 41 : 'auto',
                            height: orientation === 'vertical' ? 'auto' : 41,
                        }}
                        orientation={orientation}
                        color="primary"
                    >
                        {ctx.createTrack && (
                            <Tooltip title="Change profile" arrow placement="right">
                                <IconButton
                                    variant="contained"
                                    type="button"
                                    onClick={() => {
                                        ctx.trackProfileManager.change = TracksManager.CHANGE_PROFILE_ALL;
                                        ctx.setTrackProfileManager({ ...ctx.trackProfileManager });
                                    }}
                                >
                                    {ctx.trackRouter.getProfile()?.icon}
                                </IconButton>
                            </Tooltip>
                        )}
                        {ctx.loginUser && ctx.currentObjectType === ctx.OBJECT_TYPE_LOCAL_CLIENT_TRACK && (
                            <Tooltip title="Save to cloud" arrow placement="right">
                                <span style={styleSpan}>
                                    <IconButton
                                        variant="contained"
                                        type="button"
                                        disabled={isEmptyTrack(ctx.selectedGpxFile)}
                                        onClick={() => {
                                            ctx.selectedGpxFile.save = true;
                                            ctx.setSelectedGpxFile({ ...ctx.selectedGpxFile });
                                        }}
                                    >
                                        <CloudUpload fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                        {ctx.currentObjectType !== ctx.OBJECT_TYPE_WEATHER &&
                            ctx.currentObjectType !== ctx.OBJECT_TYPE_POI && (
                                <Tooltip title="Delete" arrow placement="right">
                                    <IconButton
                                        sx={{ mb: '1px' }}
                                        variant="contained"
                                        type="button"
                                        onClick={() => setOpenDeleteDialog(true)}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        {ctx.currentObjectType === ctx.OBJECT_TYPE_LOCAL_CLIENT_TRACK && (
                            <Tooltip title="Undo" arrow placement="right">
                                <span style={styleSpan}>
                                    <IconButton
                                        variant="contained"
                                        type="button"
                                        disabled={
                                            !isUndoPossible || (pastStates.length === 1 && _.isEmpty(pastStates[0]))
                                        }
                                        onClick={(e) => {
                                            undo();
                                            setUseSavedState(true);
                                            e.stopPropagation();
                                        }}
                                    >
                                        <Undo fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                        {ctx.currentObjectType === ctx.OBJECT_TYPE_LOCAL_CLIENT_TRACK && (
                            <Tooltip title="Redo" arrow placement="right">
                                <span style={styleSpan}>
                                    <IconButton
                                        variant="contained"
                                        type="button"
                                        disabled={!isRedoPossible}
                                        onClick={(e) => {
                                            redo();
                                            setUseSavedState(true);
                                            e.stopPropagation();
                                        }}
                                    >
                                        <Redo fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                        <Tooltip title="Close" arrow placement="right">
                            <span style={styleSpan}>
                                <IconButton
                                    variant="contained"
                                    type="button"
                                    onClick={() => {
                                        doClear();
                                        setShowContextMenu(false);
                                    }}
                                >
                                    <Close fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </ButtonGroup>
                </Paper>
                {ctx.selectedGpxFile.save && <SaveTrackDialog />}
                {openDeleteDialog &&
                    (ctx.currentObjectType === ctx.OBJECT_TYPE_LOCAL_CLIENT_TRACK ||
                        ctx.currentObjectType === ctx.OBJECT_TYPE_CLOUD_TRACK) && (
                        <DeleteTrackDialog
                            dialogOpen={openDeleteDialog}
                            setDialogOpen={setOpenDeleteDialog}
                            setShowContextMenu={setShowContextMenu}
                        />
                    )}
                {openDeleteDialog && ctx.currentObjectType === ctx.OBJECT_TYPE_FAVORITE && (
                    <DeleteFavoriteDialog dialogOpen={openDeleteDialog} setDialogOpen={setOpenDeleteDialog} />
                )}
            </div>
        )
    );
};

export default PanelButtons;
