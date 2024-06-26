import React, { useContext, useEffect, useState } from 'react';
import AppContext, { OBJECT_TYPE_FAVORITE } from '../../context/AppContext';
import FavoriteAllGroups from './FavoriteAllGroups';
import FavoriteGroup from './FavoriteGroup';
import Utils from '../../util/Utils';
import TracksManager from '../../manager/track/TracksManager';
import FavoritesManager from '../../manager/FavoritesManager';
import Empty from '../errors/Empty';

export default function FavoritesMenu() {
    const ctx = useContext(AppContext);

    const [openFavoritesGroups, setOpenFavoritesGroups] = useState([]);
    const [enableGroups, setEnableGroups] = useState([]);
    const [once, setOnce] = useState(false);

    useEffect(() => {
        let res = [];
        if (ctx.favorites.groups && !once) {
            setOnce(true);
            ctx.favorites.groups.forEach((g) => {
                if (g.hidden !== true && FavoritesManager.getGroupSize(g) > 0) {
                    res.push(g);
                }
            });
            setOpenFavoritesGroups(res);
            let ng = [];
            Object.keys(ctx.favorites).forEach((group) => {
                if (
                    ctx.favorites[group].url &&
                    ctx.favorites[group].addToMap &&
                    !enableGroups.find((g) => g.name === group)
                ) {
                    let g = ctx.favorites.groups.find((g) => g.name === group);
                    if (g) {
                        ng.push(g);
                    }
                }
            });
            let r = enableGroups.concat(ng);
            setEnableGroups([...r]);
        } else {
            if (ctx.favorites?.groups) {
                ctx.favorites.groups.forEach((g) => {
                    if (g.hidden !== true && FavoritesManager.getGroupSize(g) > 0) {
                        res.push(g);
                    }
                });
            }
            setOpenFavoritesGroups(res);
        }
    }, [ctx.favorites.groups]);

    useEffect(() => {
        let enableAllGroups = enableGroups.length === openFavoritesGroups.length;
        let disableAllGroups = enableGroups.length === 0 && ctx.favorites.groups?.length !== 0;
        if (enableAllGroups) {
            createAllLayers(ctx, true, ctx.favorites.groups).then();
        } else if (disableAllGroups) {
            deleteAllLayers(ctx, ctx.favorites.groups);
        }
    }, [enableGroups, setEnableGroups]);

    async function createAllLayers(ctx, addToMap, groups) {
        const newFavoritesFiles = Object.assign({}, ctx.favorites);
        await addAllFavorites(newFavoritesFiles, addToMap, groups);
        ctx.setFavorites(newFavoritesFiles);
    }

    function deleteAllLayers(ctx, groups) {
        let savedVisible = localStorage.getItem(FavoritesManager.FAVORITE_LOCAL_STORAGE);
        if (savedVisible) {
            localStorage.removeItem(FavoritesManager.FAVORITE_LOCAL_STORAGE);
        }
        const newFavoritesFiles = Object.assign({}, ctx.favorites);
        groups.forEach((group) => {
            if (newFavoritesFiles[group.name]) {
                newFavoritesFiles[group.name].url = null;
            }
        });
        ctx.setFavorites(newFavoritesFiles);
    }

    async function addAllFavorites(newFavoritesFiles, addToMap, groups) {
        if (groups) {
            let openGroups = [];
            for (const g of openFavoritesGroups) {
                openGroups.push(g.name);
                if (!ctx.favorites[g.name]?.url) {
                    let url = `${process.env.REACT_APP_USER_API_SITE}/mapapi/download-file?type=${encodeURIComponent(
                        g.file.type
                    )}&name=${encodeURIComponent(g.file.name)}`;
                    newFavoritesFiles[g.name] = {
                        url: url,
                        clienttimems: g.file.clienttimems,
                        updatetimems: g.file.updatetimems,
                        name: g.file.name,
                        addToMap: addToMap,
                    };
                    await getFavoriteData(g, newFavoritesFiles);
                } else {
                    newFavoritesFiles[g.name].addToMap = addToMap;
                }
            }
            newFavoritesFiles.groups = FavoritesManager.orderList(
                newFavoritesFiles.groups,
                FavoritesManager.DEFAULT_GROUP_NAME
            );
            localStorage.setItem(FavoritesManager.FAVORITE_LOCAL_STORAGE, JSON.stringify(openGroups));
        }
    }

    async function getFavoriteData(g, newFavoritesFiles) {
        let f = await Utils.getFileData(newFavoritesFiles[g.name]);
        const favoriteFile = new File([f], g.file.name, {
            type: 'text/plain',
        });
        let favorites = await TracksManager.getTrackData(favoriteFile);
        let ind = newFavoritesFiles.groups.findIndex((obj) => obj.name === g.name);
        newFavoritesFiles.groups[ind].pointsGroups = favorites.pointsGroups;
        if (favorites) {
            favorites.name = g.file.name;
            Object.keys(favorites).forEach((t) => {
                newFavoritesFiles[g.name][`${t}`] = favorites[t];
            });
        }
    }

    return (
        <>
            {openFavoritesGroups?.length > 0 || ctx.favorites?.groups?.length > 0 ? (
                <>
                    <FavoriteAllGroups setEnableGroups={setEnableGroups} favoritesGroups={openFavoritesGroups} />
                    {ctx.favorites?.groups?.length > 0 &&
                        ctx.favorites.groups.map((group, index) => {
                            return (
                                <FavoriteGroup
                                    key={group + index}
                                    index={index}
                                    group={group}
                                    enableGroups={enableGroups}
                                    setEnableGroups={setEnableGroups}
                                />
                            );
                        })}
                </>
            ) : (
                <Empty
                    title={'You don’t have favorite files'}
                    text={'You can import or create favorite files using OsmAnd App.'}
                    menu={OBJECT_TYPE_FAVORITE}
                />
            )}
        </>
    );
}
