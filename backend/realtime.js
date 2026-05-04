const clientsByUser = new Map();

function toId(id) {
  return String(id ?? '');
}

function getClientSet(userId) {
  const id = toId(userId);

  if (!clientsByUser.has(id)) {
    clientsByUser.set(id, new Set());
  }

  return clientsByUser.get(id);
}

function send(res, chunk) {
  if (res.destroyed || res.writableEnded) {
    return false;
  }

  try {
    res.write(chunk);
    return true;
  } catch {
    return false;
  }
}

function writeEvent(res, event) {
  const payload = {
    timestamp: new Date().toISOString(),
    ...event,
  };

  return send(
    res,
    `event: ${payload.type || 'event'}\ndata: ${JSON.stringify(payload)}\n\n`,
  );
}

function writeHeartbeat(res) {
  return send(res, `: ping ${Date.now()}\n\n`);
}

function subscribe(userId, res) {
  const id = toId(userId);
  const clients = getClientSet(id);
  const connection = {
    closed: false,
    heartbeat: null,
    res,
  };

  const close = () => {
    if (connection.closed) return;

    connection.closed = true;
    clearInterval(connection.heartbeat);
    clients.delete(connection);

    if (clients.size === 0) {
      clientsByUser.delete(id);
    }
  };

  connection.close = close;
  clients.add(connection);

  send(res, 'retry: 10000\n\n');
  writeEvent(res, { type: 'connected', userId: id });

  connection.heartbeat = setInterval(() => {
    if (!writeHeartbeat(res)) {
      close();
    }
  }, 25000);

  res.on('close', close);
  res.on('error', close);
  res.on('finish', close);

  return close;
}

function publishToUser(userId, event) {
  const clients = clientsByUser.get(toId(userId));
  if (!clients) return;

  for (const client of [...clients]) {
    if (!writeEvent(client.res, event)) {
      client.close();
    }
  }
}

function publishToUsers(userIds, event) {
  [...new Set((userIds || []).map(toId).filter(Boolean))].forEach((userId) => {
    publishToUser(userId, event);
  });
}

module.exports = {
  publishToUser,
  publishToUsers,
  subscribe,
};
