import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { fetchOneGame, fetchPlayers } from '../actions/games/fetch'
import { connect as subscribeToWebsocket } from '../actions/websocket'
import JoinGameDialog from '../components/games/JoinGameDialog'
import updateGame from '../actions/games/update'
import startGame from '../actions/games/start'
import './Game.css'
import Title from '../components/UI/Title'
import RaisedButton from 'material-ui/RaisedButton'

const playerShape = PropTypes.shape({
  userId: PropTypes.string.isRequired,
  name: PropTypes.string
})

class Game extends PureComponent {
  static propTypes = {
    fetchOneGame: PropTypes.func.isRequired,
    fetchPlayers: PropTypes.func.isRequired,
    subscribeToWebsocket: PropTypes.func.isRequired,
    game: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      userId: PropTypes.string.isRequired,
      players: PropTypes.arrayOf(playerShape),
      squares: PropTypes.arrayOf(PropTypes.string),
      updatedAt: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      started: PropTypes.bool,
      turn: PropTypes.number.isRequired,
    }),
    currentPlayer: playerShape,
    isPlayer: PropTypes.bool,
    isJoinable: PropTypes.bool,
    hasTurn: PropTypes.bool
  }

  state = {}

  componentWillMount() {
    const { game, fetchOneGame, subscribeToWebsocket } = this.props
    const { gameId } = this.props.match.params

    if (!game) { fetchOneGame(gameId) }
    subscribeToWebsocket()
  }

  componentWillReceiveProps(nextProps) {
    const { game } = nextProps

    if (game && !game.players[0].name) {
      this.props.fetchPlayers(game)
    }
  }

  handleClick(index) {
    const { game } = this.props
    const { currentPlayer } = this.props

    if (!game.started) { return false }

    if (this.props.hasTurn) {

      this.props.updateGame(game, index, currentPlayer)
    }

    return false
  }

  startGame = () => {
    const { game } = this.props

    this.props.startGame(game)
  }

  renderRows = (x, y) => {
    const { squares } = this.props.game
    return (
    <div className="row">
      {squares.map((square, index) => <div className='blank' id={`square${index}`}
                                           key={index} onClick={this.handleClick.bind(this, index)}>
                                           <p>{ square }</p>
                                      </div>).slice(x, y)}
    </div>)
  }

  displayWinnerName = () => {
    const { game } = this.props

    if (!game.winnerId) return null

    const winner = game.players.find(player => player.userId === game.winnerId)
    const winnerName = winner.name

    return <h2>{winnerName} won</h2>
  }

  render() {
    const { game, currentPlayer } = this.props

    if (!game) return null

    const title = game.players.map(p => (p.name || null))
      .filter(n => !!n)
      .join(' vs ')

    const currentPlayerName = `${game.players[game.turn].name}'s turn`

    return (
      <div>
        <div className="game">
          <Title content='TIC-TAC-TOE' />
          <p>{title}</p>
          <div>
            <RaisedButton label="Start game"
                          disabled={game.started || (game.players.length !== 2)}
                          primary={true}
                          onClick={this.startGame} />
          </div>

          {game.started && <h2>{game.players[game.turn].name}</h2>}
          {this.displayWinnerName()}

          <div className="board">
            {this.renderRows(0, 3)}
            {this.renderRows(3, 6)}
            {this.renderRows(6)}
          </div>

          <JoinGameDialog gameId={game._id} />
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ currentUser, games }, { match }) => {
  const game = games.filter((g) => (g._id === match.params.gameId))[0]
  const currentPlayer = game && game.players.filter((p) => (p.userId === currentUser._id))[0]
  const hasTurn = !!currentPlayer && game.players[game.turn].userId === currentUser._id
  return {
    currentPlayer,
    game,
    isPlayer: !!currentPlayer,
    hasTurn,
    isJoinable: game && !currentPlayer && game.players.length < 2,
  }
}

export default connect(mapStateToProps, {
  subscribeToWebsocket,
  fetchOneGame,
  fetchPlayers,
  updateGame,
  startGame
})(Game)
