const express = require('express');
const { subscribe } = require('../realtime');

const router = express.Router();

router.get('/:userId', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no',
  });

  res.socket?.setKeepAlive?.(true);
  res.socket?.setNoDelay?.(true);
  res.flushHeaders?.();
  subscribe(req.params.userId, res);
});

module.exports = router;
