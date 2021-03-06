import React, { useEffect, useState } from 'react';
import { memoize } from 'lodash'
import { useParams } from "react-router-dom";
import { Message, Icon, Loader } from 'semantic-ui-react'
import { mix, utils } from '@youka/youtube'
import {
  FILE_VIDEO,
  FILE_CAPTIONS,
  MEDIA_MODES,
  CAPTIONS_MODES,
  MODE_MEDIA_INSTRUMENTS,
  MODE_CAPTIONS_LINE,
  fileurl,
  generate,
} from '../lib/mess'
import VideoList from '../comps/VideoList'
import Player from '../comps/Player';
import Search from '../comps/Search'
import Radio from '../comps/Radio'

const debug = require('debug')('youka:desktop')
const mix_memoize = memoize(mix)

export default function WatchPage() {
  const { youtubeID } = useParams()
  if (!youtubeID) return null

  const defaultVideo = MODE_MEDIA_INSTRUMENTS
  const defaultCaptions = MODE_CAPTIONS_LINE

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [videoMode, setVideoMode] = useState(defaultVideo)
  const [captionsMode, setCaptionsMode] = useState(defaultCaptions)
  const [videoURL, setVideoURL] = useState()
  const [captionsURL, setCaptionURL] = useState()
  const [error, setError] = useState()
  const [progress, setProgress] = useState(true)

  function handleResults(results) {
    setResults(results)
  }

  function handleLoading(value) {
    setLoading(value)
  }

  function handleChangeVideo(e, data) {
    changeVideo(data.value)
  }
  
  function changeVideo(mode) {
    const url = fileurl(youtubeID, mode, FILE_VIDEO)
    if (url) {
      setVideoMode(mode)
      setVideoURL(url)
    }
  }

  function changeCaptions(mode) {
    const url = fileurl(youtubeID, mode, FILE_CAPTIONS)
    if (url) {
      setCaptionsMode(mode)
      setCaptionURL(url)
    }
  }

  function handleChangeCaptions(e, data) {
    changeCaptions(data.value)
  }

  useEffect(() => {
    (async function () {
      const results = await mix_memoize(youtubeID)
      results.shift()
      setResults(utils.cleanResults(results))
    })()
  }, [youtubeID])

  useEffect(() => {
    (async function () {
      try {
        window.scrollTo({top: 0, behavior: 'smooth'})
        setError(null)
        setProgress(true)
        debug('start generate')
        await generate(youtubeID)
        debug('end generate')
        changeVideo(defaultVideo)
        changeCaptions(defaultCaptions)
        setProgress(false)
        window.scrollTo({top: 0, behavior: 'smooth'})
      } catch(error) {
        setError(error.toString())
        setProgress(false)
      }
    })()
  }, [youtubeID])

  return (
    <div className='flex flex-col items-center'>
      <Search handleResults={handleResults} handleLoading={handleLoading}/>
      { error ?
        <Message negative>
          <Message.Header>Ooops, some error occurred :(</Message.Header>
          <p>{error}</p>
        </Message>
      : null}
      { progress ?
        <div className='w-2/4'>
          <Message icon>
            <Icon name='circle notched' loading />
            <Message.Content>
              <Message.Header>Loading</Message.Header>
              It may take a minute..
            </Message.Content>
          </Message>
        </div>
       : null
      }
      {
        videoURL && !error && !progress ?
        <div>
          <div style={{ width: '60vw' }}>
            <Player youtubeID={youtubeID} videoURL={videoURL} captionsURL={captionsURL} />
          </div>
          <div className='flex flex-row w-full m-2 justify-center'>
            <div className='flex flex-row p-2 mx-4'>
              <div className='font-bold self-center'>VIDEO</div>
              <Radio name='video' checked={videoMode} values={MEDIA_MODES} onChange={handleChangeVideo} />
            </div>
            <div className='flex flex-row p-2 mx-4'>
              <div className='font-bold self-center'>CAPTIONS</div>
              <Radio name='captions' checked={captionsMode} values={CAPTIONS_MODES} onChange={handleChangeCaptions} />
            </div>
          </div>
        </div>
        : null
      }
      {
        results.length && !loading ?
        <VideoList videos={results} /> :
        <Loader active inline='centered' />
      }
    </div>
  )
}